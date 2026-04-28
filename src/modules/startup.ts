import { Application } from "express";
import { Module } from "module";

// Import Proto
import * as wm from "../wmmt/v388.proto";

// Import Util
import * as common from "./util/common";
import * as startupFunctions from "./startup/functions";

export default class StartupModule extends Module
{
    register(app: Application): void
    {
        // Register system info upon booting
        app.post('/method/register_system_info', async (req, res) =>
        {
            // Get the request body
            let body = wm.v388.protobuf.RegisterSystemInfoRequest.decode(req.body);

            // Get the current date/time (unix epoch)
            let date = Math.floor(new Date().getTime() / 1000);

            // Try Catch
            try
            {
                // Get Competition (OCM) Event Date
                let getCompetitionSchedule = await startupFunctions.competitionSchedule(date, null);
                let additionalCompetitionMsg = getCompetitionSchedule.additionalCompetitionMsg;
                
                // Response data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

                    // Place
                    regionId: body.allnetRegion0,
                    placeId: body.regionName0,

                    // Pajero
                    pajeroDiscloseAt: Math.floor(new Date().getTime() / 1000),

                    // Car Campaign
                    carCampaignStartAt: Math.floor(new Date().getTime() / 1000),
                    carCampaignEndAt: 2147483647,

                    // Team Suspension
                    teamSuspensionAnnouncementStartAt: 0,
                    teamSuspensionStartAt:0,

                    // Transfer window
                    successionCloseAnnouncementStartAt: 0,
                    successionCloseAt: 0,
                    successionCloseAnnouncementEndAt: 0,

                    // face recognition wtf?
                    faceRecognitionPermitted: false,

                    // Log
                    allowedClientLogTypes: [],

                    // Feature Version
                    featureVersion: {
                        version: 0,
                        year: 2013,
                        month: 10,
                        pluses: 0,
                        releaseAt: 0 // idk what this is
                    },

                    // Competition (OCM)
                    ...additionalCompetitionMsg,

                    // Ghost Selection Wait
                    ghostSelectionMinRedoWait: 30,
                    ghostSelectionMaxRedoWait: 4000
                }

                // Encode the response
                let message = wm.v388.protobuf.RegisterSystemInfoResponse.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Ping
        app.post('/method/ping', async (req, res) =>
        {
            let body = wm.v388.protobuf.PingRequest.decode(req.body);

            // Try Catch
            try
            {
                // Response data
                let ping = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                    pong: body.ping || 1
                };

                // Encode the response
                let message = wm.v388.protobuf.PingResponse.encode(ping);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Register System Stats
        app.post('/method/register_system_stats', async (req, res) =>
        {
            let body = wm.v388.protobuf.RegisterSystemStatsRequest.decode(req.body);

            // Try Catch
            try
            {
                // TODO: Actual stuff here
                // This is literally just bare-bones so the shit boots

                // Response data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                }

                // Encode the response
                let message = wm.v388.protobuf.RegisterSystemStatsResponse.encode(msg);

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
