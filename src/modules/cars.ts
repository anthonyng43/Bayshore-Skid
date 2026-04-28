import { Application } from "express";
import { Config } from "../config";
import { Module } from "module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/v388.proto";

// Import Util
import * as common from "./util/common";
import * as carFunctions from "./cars/functions";

export default class CarModule extends Module
{
	register(app: Application): void
	{
        // Load Car
		app.post('/method/load_car', async (req, res) =>
		{
            // Get the request body
			let body = wm.v388.protobuf.LoadCarRequest.decode(req.body);

			// Try Catch
			try
			{
				// Get the car (required data only) with the given id
				let car = await carFunctions.getCar(body.carId);

				// Get Registered HoF Data
				let registeredTarget = await carFunctions.getRegisteredTarget(body.carId);

				// Get Challenger Data
				let opponentsTarget = await carFunctions.getOpponentsTarget(body.carId, registeredTarget.registeredargetAvailable);

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

					// v388.protobuf.Car;
					car: car,

					// Other Car Data (tuningPoint, odometer, playCount, etc)
					...car,
					stLoseBits: car.longLoseBits,

					// Stamp or Challenger
					challenger: opponentsTarget.challenger,

					// Competition (OCM)
					opponentGhost: registeredTarget.opponentGhost,
					opponentTrailId: registeredTarget.opponentTrailId,
					opponentCompetitionId: registeredTarget.opponentCompetitionId,
					competitionParameter: null,

					// Titles
					specialTitles: null,
					earnedTitles: null,
				};

				// Generate the load car response message
				let message = wm.v388.protobuf.LoadCarResponse.encode(msg);

				// Send the response
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Create new car
		app.post('/method/create_car', async (req, res) =>
		{
			// Get the request body
			let body = wm.v388.protobuf.CreateCarRequest.decode(req.body);

			// Try Catch
			try
			{
				// Trim Mojibake
				let trimWord = common.trimMojibake(body.cardChipId);
				body.cardChipId = trimWord;

				// Create the Car
				let createCar = await carFunctions.createCar(body);
				let tune = createCar.tune;
				let carInsert = createCar.carInsert;

				// Switch on tune status
				let getCarTune = await carFunctions.getCarTune(tune, carInsert);
				let additionalInsert = getCarTune.additionalInsert;

				// Insert the car into the database
				let car = await prisma.car.create({
					data: {
						...carInsert,
						...additionalInsert
					}
				});

				// Get the user's current car order
				let carOrder = createCar.user.carOrder;
				await carFunctions.carOrder(carOrder, car, createCar.user.id);

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

					// User ID
					accessCode: body.accessCode,
					banapassportAmId: body.banapassportAmId,
					mbid: null,

					// Car Data
					carId: car.carId,
					car,
					...carInsert,
					...additionalInsert,
				}

				// Generate the load car response message
				let message = wm.v388.protobuf.CreateCarResponse.encode(msg);

				// Send the response
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Saving the certain car update
		// On saving bannapass screen OR after exiting user's detail car data OR after editing car dress up on terminal
		app.post('/method/update_car', async (req, res) => {

			// Get the request body
			let body = wm.v388.protobuf.UpdateCarRequest.decode(req.body);

			// Try Catch
			try
			{
				// Update the car
				await carFunctions.updateCar(body);

				// Update the car setting
				await carFunctions.updateCarSetting(body);
				
				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
				}

				// Encode the response
				let message = wm.v388.protobuf.UpdateCarResponse.encode(msg);

				// Send the response
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
        })

		// Transfer via prepare_car_succession
		app.post('/method/prepare_car_succession', async (req, res) => {

			// Get the request body
			let body = wm.v388.protobuf.PrepareCarSuccessionRequest.decode(req.body);

			// Try Catch
			try
			{
				// Get the car info
				let car = await carFunctions.W3PCheck(body);

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

					successionId: car.carId,

					searchCode: car.searchCode
				}

				// Encode the response
				let message = wm.v388.protobuf.PrepareCarSuccessionResponse.encode(msg);

				// Send the response
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
        })

		// Transfer via prepare_car_succession
		app.post('/method/succeed_car', async (req, res) => {

			// Get the request body
			let body = wm.v388.protobuf.SucceedCarRequest.decode(req.body);

			// Try Catch
			try
			{
				// Get the car info
				let car = await carFunctions.WM4Transfer(body);

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

					carId: car.carId
				}

				// Encode the response
				let message = wm.v388.protobuf.SucceedCarResponse.encode(msg);

				// Send the response
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
        })
    }
}