import { Application } from "express";
import { Module } from "../module";
import { prisma } from "..";
import { Config } from "../config";
import Long from "long";

// Import Proto
import * as wm from "../wmmt/v388.proto";

// Import Util
import * as common from "./util/common";
import * as gameFunction from "./game/functions";
import * as meter_reward from "./util/meter_reward";
import * as story from "./game/story";
import * as time_attack from "./game/time_attack";
import * as ghost from "./game/ghost";
import * as versus from "./game/versus";
import * as ghost_save_trail from "./ghost/ghost_save_trail";

export default class GameModule extends Module
{
	register(app: Application): void
	{
		// Saving the game result on mileage screen
		app.post('/method/save_game_result', async (req, res) =>
		{
			// Get the request body
			let body = wm.v388.protobuf.SaveGameResultRequest.decode(req.body);

			// Get user's status from car
			let user = null;
			let userCar = await prisma.car.findFirst({
				where: {
					carId: body.carId
				}
			});

			if (!userCar) return;
			{
				user = await prisma.user.findFirst({
					where: {
						id: userCar.userId
					}
				});
			}

			if (!user?.userBanned)
			{
				// Get the user's car
				let car = await prisma.car.findFirst({
					where: {
						carId: body.carId
					},
					include:{
						lastPlayedPlace: true
					}
				});

				// Declare some variable for message response
				let ghostModePlay : boolean = false;
				let updateNewTrail : boolean = true;
				let competitionModePlay : boolean = false;
				let crownModePlay : boolean = false;

				// Switch on the gamemode
				switch (body.gameMode) 
				{
					// Save Story Result
					case wm.v388.protobuf.GameMode.MODE_STORY:
					{
						// Calling save story result function (BASE_PATH/src/util/games/story.ts)
						await story.saveStoryResult(body, car); 

						// Break the switch case
						break;
					}

					// Save Time Attack Result
					case wm.v388.protobuf.GameMode.MODE_TIME_ATTACK:
					{
						// Calling save time attack result function (BASE_PATH/src/util/games/time_attack.ts)
						await time_attack.saveTimeAttackResult(body);

						// Break the switch case
						break;
					}

					// Save Versus Battle Result
					case wm.v388.protobuf.GameMode.MODE_VS_BATTLE:
					{
						// Calling save vs battle result function (BASE_PATH/src/util/games/versus.ts)
						await versus.saveVersusBattleResult(body, car); 

						// Break the switch case
						break;
					}

					// Save Ghost Battle Result
					case wm.v388.protobuf.GameMode.MODE_GHOST_BATTLE:
					{
						// Calling save ghost battle result function (BASE_PATH/src/util/games/ghost.ts)
						let ghostReturn = await ghost.saveGhostBattleResult(body, car);

						// Set this to tell the server if user is playing ghost battle mode
						ghostModePlay = ghostReturn.ghostModePlay;

						// For OCM : Disable update trail if current advantage distance record is not better than previous advantage distance record
						// For Crown : Disable update trail if lose
						// Ghost Battle will return true 
						updateNewTrail = ghostReturn.updateNewTrail;

						// Check if user playing OCM Ghost Battle Mode
						competitionModePlay = ghostReturn.competitionModePlay;

						// Check if user playing Crown Ghost Battle
						crownModePlay = ghostReturn.crownModePlay;

						// Break the switch case
						break;
					}

					// Save Event Result
					case wm.v388.protobuf.GameMode.MODE_EVENT:
					{
						// Break the switch case
						break;
					}
				}

				// Update Car Data
				await gameFunction.updateCar(body, car);

				// Add discarded function
				if (body.playCount % 60 === 0 && body.playCount !== 0)
				{
					await prisma.user.update({
						where: {
							id: user!.id
						},
						data: {
							hasHp600Count: user!.hasHp600Count + 1
						}
					});
				}

				// Check Every n*60 play give reward feature config
				let giveMeterReward = Config.getConfig().gameOptions.giveMeterReward || 0;

				// Check if this feature activated and check if user's play count is n*60 play
				if(giveMeterReward === 1 && body.playCount % 60 === 0 && body.playCount !== 0)
				{
					// Calling give meter reward function
					await meter_reward.giveMeterRewards(body);
				}

				let ghostSessionId = 0;

				// Normal Ghost Battle mode or Crown Ghost Battle game mode is completed
				// and set session for saving the ghost trail
				if(ghostModePlay === true && competitionModePlay === false && updateNewTrail === true && crownModePlay === false)
				{
					ghostSessionId = Math.floor(Math.random() * 50) + 1 // Normal Ghost session id range
				}
				// Crown Ghost Battle
				else if(ghostModePlay === true && competitionModePlay === false && updateNewTrail === true && crownModePlay === true)
				{
					ghostSessionId = Math.floor(Math.random() * 50) + 51 // Normal Ghost session id range

				}
				// Competition (OCM) Ghost Battle game mode is completed
				else if(ghostModePlay === true && competitionModePlay === true && updateNewTrail === true && crownModePlay === false)
				{ 
					ghostSessionId = Math.floor(Math.random() * 100) + 101 // Competition (OCM) session id range
				}

				if (user?.teamId != 0) {
					await prisma.team.update({
						where: {
							teamId: user?.teamId
						},
						data: {
							updatedAt: body.playedAt
						}
					});
				}
				
				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

					// Ghost Session ID
					ghostSessionId: ghostSessionId
				}
				
				// Encode the response
				let message = wm.v388.protobuf.SaveGameResultResponse.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			else
			{
				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_FORBIDDEN,
				}
				
				// Encode the response
				let message = wm.v388.protobuf.SaveGameResultResponse.encode(msg);

				// Send the response to the client
				common.sendResponse(message, res, req.rawHeaders);
			}
		})

		// Saving the ghost trail on mileage screen
		app.post('/method/register_ghost_trail', async (req, res) => {

            // Get the request body for the register ghost trail request
			let body = wm.v388.protobuf.RegisterGhostTrailRequest.decode(req.body);

            // Get the session id
			let actualSessionId: number = 0;

			// If the session are set, and are long data
            if(Long.isLong(body.ghostSessionId))
            {
                // Convert them to BigInt and add to the data
                actualSessionId = common.getBigIntFromLong(body.ghostSessionId);
			}

			// -----------------------------------------------------------------------------------------
            // Competition (OCM) game mode session id
			if(actualSessionId > 100 && actualSessionId < 201)
			{ 
				console.log('Competition (OCM) Ghost Battle Game found');

				// User playing ocm battle game mode
				await ghost_save_trail.saveCompetitionGhostTrail(body);
			}
            // Ghost Battle or Crown Ghost Battle game Mode session id
			else if(actualSessionId > 50 && actualSessionId < 101)
			{
				console.log('Crown Ghost Battle Game found');

				// User is playing crown ghost battle game mode
				await ghost_save_trail.saveCrownGhostTrail(body);

				// Saving Ghost Path and Tuning
				await ghost_save_trail.savePathAndTuning(body);
			}
			// Normal Ghost Battle
			else if(actualSessionId > 0 && actualSessionId < 50)
			{
				console.log('Normal Ghost Battle Game found');

				// User is playing normal ghost battle game mode
				await ghost_save_trail.saveNormalGhostTrail(body);

				// Saving Ghost Path and Tuning
				await ghost_save_trail.savePathAndTuning(body);
			}
			// -----------------------------------------------------------------------------------------
	
            // Response data
			let msg = {
				error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS
			}
			
			// Encode the response
            let message = wm.v388.protobuf.RegisterGhostTrailResponse.encode(msg);

            // Send the response to the client
            await common.sendResponse(message, res, req.rawHeaders);
		})

		// Load user's car game data
		app.post('/method/load_game_history', async (req, res) =>
		{
			// Get the request body
			let body = wm.v388.protobuf.LoadGameHistoryRequest.decode(req.body);

			// Try Catch
			try
			{
				// Get the car info
				let car = await prisma.car.findFirst({
					where: {
						carId: body.carId
					},
					include:{
						lastPlayedPlace: true
					}
				});

				// Get Time Attack Record
				let taRecords = await gameFunction.getTimeAttackRecord(body);

				// Get Ghost Battle Record
				let ghostBattleRecord = await gameFunction.getGhostBattleRecord(body);
				
				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

					// Time Attack Record
					taRecords: taRecords.ta_records,
					taRankingUpdatedAt: taRecords.date,

					// Ghost Battle Record
					ghostHistory: ghostBattleRecord.ghostBattle_records,
					ghostBattleCount: car!.rgPlayCount,
					ghostBattleWinCount: car!.rgWinCount,
				}

				// Encode the response
				let message = wm.v388.protobuf.LoadGameHistoryResponse.encode(msg);
				
				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
        })

		// Save Charge
		app.post('/method/save_charge', async (req, res) =>
		{
			// Get the request body
			let body = wm.v388.protobuf.SaveChargeRequest.decode(req.body);

			// Try Catch
			try
			{
				// TODO: Actual stuff here
				// This is literally just bare-bones so the shit boots

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
				};

				// Encode the response
				let message = wm.v388.protobuf.SaveChargeResponse.encode(msg);
				
				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
        })
    }
}
