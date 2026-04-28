import { Application } from "express";
import { Config } from "../config";
import { Module } from "module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/v388.proto";

// Import Util
import * as common from "./util/common";
import * as userFunctions from "./users/functions";

export default class UserModule extends Module 
{
    register(app: Application): void 
	{
        // Load user data when entering the game or after tapping the bannapass card
		app.post('/method/load_user', async (req, res) => 
		{
            // Get the request body for the load user request
			let body = wm.v388.protobuf.LoadUserRequest.decode(req.body);
			
			// Try Catch
			try 
			{
				// Trim Mojibake
				let trimWord = common.trimMojibake(body.cardChipId);
				body.cardChipId = trimWord;

				// Block blank card.ini data and vanilla TP blank card data
				let blankids = ["000000000000000000000000000000000", "000000000000000000000", "7F5C9744F111111143262C3300040610", "30764352518498791337"];
				if(blankids.indexOf(body.cardChipId) > -1 || blankids.indexOf(body.accessCode) > -1)
				{
					body.cardChipId = '';
					body.accessCode = '';
				}

				// Get the user from the database
				let user = await prisma.user.findFirst({
					where: {
						chipId: body.cardChipId,
						accessCode: body.accessCode
					},
					include: {
						cars: {
							include: {
								state: true,
								lastPlayedPlace: true
							}
						}
					}
				});

				if (!user)
				{
					console.log('no such user');

					// Response data
					let msg = {
						error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
						numOfOwnedCars: 0,
						cars: [],
						hasHp600Car: false,
						hp600Count: 0,
						tutorials: 0
					};

					// Prevent creating user data if chip id or access code is blank or empty
					if (!body.cardChipId || !body.accessCode) 
					{
						msg.error = wm.v388.protobuf.ErrorCode.ERR_REQUEST;

						// Encode the response
						let message = wm.v388.protobuf.LoadUserResponse.encode(msg);

						// Send the response to the client
						await common.sendResponse(message, res, req.rawHeaders);

						return;
					}

					// User not yet exist
					let userNotYetExist = await userFunctions.userNotYetExist(body, msg);
					msg = userNotYetExist.msg;

					// Encode the response
					let message = wm.v388.protobuf.LoadUserResponse.encode(msg);

					// Send the response to the client
					await common.sendResponse(message, res, req.rawHeaders);

					return;
				}

				// Check if car orde array is not created
				await userFunctions.getCarOder(user);

				// Get the states of the user's cars
				let carStates = user.cars.map((e: { state: any; }) => e.state);

				// Proper number of owned cars including deleted
				let numOfOwnedCars = await prisma.car.count({
					where: {
						userId: user.id
					}
				});

				// Discard
				let hasHp600Car = false;
				if (user.hasHp600Count > 0)
				{
					hasHp600Car = true;
				}

				// Team
				let teamId =  0;
				let teamName = 'ＷＡＮＧＡＮ';
				let teamStickerFont = 1;

				let getTeam = await prisma.team.findFirst({
					where: {
						teamId: user.teamId!
					}
				});

				if (getTeam)
				{
					teamId = getTeam.teamId;
					teamName = getTeam.name;
					teamStickerFont = getTeam.stickerFont;
				}

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

					// Lock Banapassport
					unlockAt: 0,

					// Access Code
					accessCode: user.accessCode,

					// Banapassport Aime ID
					banapassportAmId: user.id,

					// Personal ID
					personalId: user.id,

					// User ID
					userId: user.id,

					// Number of Owned Cars
					numOfOwnedCars: numOfOwnedCars,

					// 5 cars in-game, 100 cars on terminal
					cars: user.cars.slice(0, body.maxCars),

					// Car States
					carStates,

					// hasHp600Car
					hasHp600Car: hasHp600Car,

					// hasHp600Count
					hp600Count: user.hasHp600Count,

					// Tutorials Confirmed
					tutorials: user.tutorials,

					// Car Campaign User State
					carCampaignUserState: wm.v388.protobuf.CarCampaignUserState.CAR_CAMPAIGN_NOT_ACCEPTED,

					// Competition (OCM) participation
					competitionUserState: wm.v388.protobuf.GhostCompetitionParticipantState.COMPETITION_NOT_PARTICIPATED,

					// Team Id
					teamId: teamId,

					// Team Name
					teamName: teamName,

					// Team Sticker Font
					teamStickerFont: teamStickerFont
				}

				// Check Competition (OCM) Car Participation State
				let competitionParticipation = await userFunctions.competitionParticipation(msg, msg.cars, carStates);
				msg.competitionUserState = competitionParticipation.competitionUserState;
				msg.carStates = competitionParticipation.carStates;

				// Response data if user is locked
				if (user.locked) 
				{
					msg.error = wm.v388.protobuf.ErrorCode.ERR_USER_LOCKED;
				}
				
				// Response data if user is banned
				if (user.userBanned) 
				{
					msg.error = wm.v388.protobuf.ErrorCode.ERR_ID_BANNED;
				}

				// Encode the response
				let message = wm.v388.protobuf.LoadUserResponse.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Create User Request
        app.post('/method/create_user', async (req, res) => 
		{
			// This request is sent by the terminal when you
			// select 'yes' to register on the starting menu
			// if you have not created your account yet.

			// However, we don't really need to process it as 
			// the load_user command already creates the user.
			// we do, however need to send a valid response 
			// otherwise the terminal crashes.

			// Get the request body for the create user request
			let body = wm.v388.protobuf.CreateUserRequest.decode(req.body);

			// Try Catch
			try
			{
				// Trim Mojibake
				let trimWord = common.trimMojibake(body.cardChipId);
				body.cardChipId = trimWord;

				// Get the user info via the card chip id
				let user = await prisma.user.findFirst({
					where: {
						chipId: body.cardChipId,
						accessCode: body.accessCode
					}
				});

				// Message object
				let msg;

				// User exists
				if (user)
				{
					msg = {
						// Success error message
						error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

						// User's user id
						userId: user.id
					}
				}
				else // User does not exist
				{
					msg = {
						// User not found error message
						error: wm.v388.protobuf.ErrorCode.ERR_NOT_FOUND, 

						// No user id
						userId: 0
					}
				}

				// Generate the response for the create user request
				let message = wm.v388.protobuf.CreateUserResponse.encode(msg);

				// Send response to client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		});
        
        // Update User Lock
		app.post('/method/update_user_lock', async (req, res) => 
		{
			// Get the request body
			let body = wm.v388.protobuf.UpdateUserLockRequest.decode(req.body);

			// Try Catch
			try
			{
				// get the config
				let userConfig = Config.getConfig().gameOptions.multiLoggonEnabled;

				// if config is false
				if (!userConfig)
				{
					// User Lock Variable
					let locked: boolean = false;
	
					// Lock the User
					if (body.unlockAt > 0)
					{
						locked = true;
					}
	
					await prisma.user.update({
						where: {
							id: body.userId
						},
						data:{
							locked: locked
						}
					});
				}

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
				}
				
				// Encode the response
				let message = wm.v388.protobuf.UpdateUserLockResponse.encode(msg);

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
