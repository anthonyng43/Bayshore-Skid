import { Application } from "express";
import { Module } from "module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/v388.proto";
import * as wmsrv from "../wmmt/service.proto";

// Import Util
import * as common from "./util/common";
import * as ghostFunctions from "./ghost/functions";
import * as ghost_default_car from "./util/ghost_default_car";

export default class GhostModule extends Module
{
	register(app: Application): void
	{
        // Load Ghost Battle Info
		app.post('/method/load_ghost_battle_info', async (req, res) =>
		{
			// Get the request body
			let body = wm.v388.protobuf.LoadGhostBattleInfoRequest.decode(req.body);

			// Try Catch
			try
			{
				// Get Friends
				let friendCars: wm.v388.protobuf.FriendCar[] = [];

				let listFriendCars = await prisma.friendCar.findMany({
					where: {
						carId: body.carId
					}
				});

				if (listFriendCars) {
					for (let car of listFriendCars) {
						let opponentCar = await prisma.car.findFirst({
							where: {
								carId: car.friendCarId
							}
						});

						if (opponentCar) {
							friendCars.push(wm.v388.protobuf.FriendCar.create({
								car: opponentCar!,
								friendshipLevel: car.friendshipLevel,
								revengeLevel: car.revengeLevel,
								nonhuman: false
							}));
						}
					}
				}

				let defaultOpponent = await ghost_default_car.RandomGhost();

				let hasRevenges = false;
				let revengersCount = await prisma.ghostRevenger.count({
					where: {
						carId: body.carId
					}
				});
				if (revengersCount > 0) hasRevenges = true;

				let hasHistory = false;
				let ghostBattleRecord = await prisma.ghostBattleRecord.count({
					where: {
						carId: body.carId
					}
				});
				if (ghostBattleRecord > 0) hasHistory = true;

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
					
					// Friend Cars
					friendCars: friendCars,

					// Default Ghost
					defaultOpponent: defaultOpponent,

					// Revenge
					hasRevenges: hasRevenges,

					// History
					hasHistory: hasHistory,
				};

				// Encode the response
				let message = wm.v388.protobuf.LoadGhostBattleInfoResponse.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
        })

		// Load Revenges
		app.post('/method/load_revenges', async (req, res) => 
		{
			let body = wm.v388.protobuf.LoadRevengesRequest.decode(req.body);

			// Try Catch
			try {
				let ghosts : wmsrv.v388.protobuf.GhostCar[] = [];
				let revengers = await prisma.ghostRevenger.findMany({
					where: {
						carId: body.carId
					}
				});

				for (let revenger of revengers) {
					let opponentCar = await prisma.car.findFirst({
						where: {
							carId: revenger.revengerCarId
						}
					});

					let opponentGhost = await prisma.ghostTrail.findFirst({
						where: {
							carId: revenger.carId
						}
					});

					if (opponentGhost) {
						ghosts.push(wm.v388.protobuf.GhostCar.create({
							car: opponentCar!,
							area: opponentGhost.area,
							ramp: opponentGhost.ramp,
							ghostLevel: opponentCar?.ghostLevel,
							revengeLevel: revenger.revengeLevel
						}));
					}
				}

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

					ghosts: ghosts
				};

				// Encode the response
				let message = wm.v388.protobuf.LoadRevengesResponse.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Load History Target
		app.post('/method/load_ghost_battle_history', async (req, res) =>
		{
            // Get the request body
			let body = wm.v388.protobuf.LoadGhostBattleHistoryRequest.decode(req.body); 

			// Try Catch
			try
			{
				// Get Stamp Target
				let getOpponentHistory = await ghostFunctions.getOpponentHistory(body.carId);
				let cars = getOpponentHistory.opponentHistory;
				
				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
					cars: cars,
				};

				// Encode the response
				let message = wm.v388.protobuf.LoadGhostBattleHistoryResponse.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Lock Crown
		app.post('/method/lock_crown', async (req, res) =>
		{
			// Get the information from the request
			let body = wmsrv.v388.protobuf.LockCrownRequest.decode(req.body);

			// Try Catch
			try
			{
				// TODO: Actual stuff here
				// This is literally just bare-bones so the shit boots

				// Response data
				let msg = {
					error: wmsrv.v388.protobuf.ErrorCode.ERR_SUCCESS,
				};

				// Encode the response
				let message = wmsrv.v388.protobuf.LockCrownResponse.encode(msg);

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