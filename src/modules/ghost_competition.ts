import { Application } from "express";
import { Module } from "module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/v388.proto";
import * as wmsrv from "../wmmt/service.proto";

// Import Util
import * as common from "./util/common";
import * as ghost_ocm from "./ghost/functions_ghost_competition";

export default class GhostModule extends Module
{
    register(app: Application): void
    {
        // Get OCM Battle event info
        app.post('/method/load_ghost_competition_info', async (req, res) =>
        {
            // Get the request body
			let body = wm.v388.protobuf.LoadGhostCompetitionInfoRequest.decode(req.body);

            // Try Catch
            try
            {
                // Get the current date/time (unix epoch)
                let date = Math.floor(new Date().getTime() / 1000);

                // Get Competition (OCM) Event Date
                let ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({
                    where: {
                        competitionId: body.competitionId
                    }
                });
                
                // Declaring Response Data for later to use
                let msg: any;

                // Load user Competition (OCM) record data
                if(ghostCompetitionSchedule)
                {
                    // Check Competition (OCM) Main Draw Period
                    let competitionPeriodCount = await prisma.ghostCompetitionSchedulePeriod.count({ 
                        where: {
                            competitionDbId: ghostCompetitionSchedule.dbId
                        }
                    });
                    
                    if(competitionPeriodCount === 0)
                    {
                        await ghost_ocm.competitionCalculatingPeriod(ghostCompetitionSchedule);
                    }
                    // else {} skip if period already calculated

                    // Current date is Competition (OCM) main draw
                    if(ghostCompetitionSchedule.competitionStartAt < date && ghostCompetitionSchedule.competitionCloseAt > date)
                    {
                        // Get OCM Period ID
                        let competitionPeriodId = await prisma.ghostCompetitionSchedulePeriod.findFirst({ 
                            where: {
                                competitionDbId: ghostCompetitionSchedule.dbId,
                                startAt: 
                                {
                                    lte: date, // period StartAt is less than current date
                                },
                                closeAt:
                                {
                                    gte: date, // period CloseAt is greater than current date
                                }
                            },
                            select: {
                                periodId: true
                            }
                        });

                        // Period found
                        if(competitionPeriodId)
                        {
                            // Get Main Draw data for the car
                            let competitionMainDraw = await ghost_ocm.competitionInfoMainDraw(body, ghostCompetitionSchedule.dbId, competitionPeriodId.periodId);

                            // Response Data
                            msg = competitionMainDraw.msg;
                        }
                        // Period not found
                        else
                        {
                            msg = {
                                error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                                periodId: 0,
                                closed: true, // true = user cannot enter Competition (OCM)
                                qualified: false // false = user cannot join Competition (OCM)
                            }
                        } 
                    }
                    // Current date is Competition (OCM) qualifying day
                    else if(ghostCompetitionSchedule.qualifyingPeriodStartAt < date && ghostCompetitionSchedule.qualifyingPeriodCloseAt > date)
                    {
                        console.log('Current Competition (OCM) Day: Qualifying Day');

                        // Get Qualifying Day data for the car
                        let competitionQualifyingDays = await ghost_ocm.competitionInfoQualifyingDay(body, ghostCompetitionSchedule.dbId);

                        // Response Data
                        msg = competitionQualifyingDays.msg;
                    }
                    // Competition (OCM) has ended
                    else if(ghostCompetitionSchedule.competitionCloseAt < date && ghostCompetitionSchedule.competitionEndAt > date)
                    {
                        console.log('Current Competition (OCM) Day: OCM has Ended');

                        // Get End Day data for the car
                        let competitionEndDays = await ghost_ocm.competitionEndDay(body, ghostCompetitionSchedule.dbId);

                        // Response Data
                        msg = competitionEndDays.msg;
                    }
                    // Just for error handling if it's not qualifying or main draw period
                    else
                    {
                        msg = {
                            error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                            periodId: 0,
                            closed: true, // true = user cannot enter Competition (OCM)
                            qualified: false // false = user cannot join Competition (OCM)
                        }
                    }
                }
                // No Competition (OCM) available
                else
                {
                    msg = {
                        error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                        closed: true // closed is true = user cannot join Competition (OCM)
                    }
                }
                
                // Encode the response
                let message = wm.v388.protobuf.LoadGhostCompetitionInfoResponse.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Get the No 1 Competition (OCM) Ghost for qualifying day and competition day
        app.get('/resource/ghost_competition_target', async (req, res) =>
        {
            // Get url query parameter
			let competition_id = Number(req.query.competition_id);
			let period_id = Number(req.query.period_id);

            // Try catch
            try
            {
                // Get the current date/time (unix epoch)
                let date = Math.floor(new Date().getTime() / 1000);

                // Get Competition (OCM) Event Date
                let ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({
                    where: {
                        competitionId: competition_id
                    }
                });
                let competitionSchedule;

                if(ghostCompetitionSchedule)
                {
                    // Creating GhostCompetitionSchedule
                    competitionSchedule = wmsrv.v388.protobuf.GhostCompetitionSchedule.create({ 

                        // Competition ID
                        competitionId: ghostCompetitionSchedule.competitionId,

                        // Competition Qualifying Start Timestamp
                        qualifyingPeriodStartAt: ghostCompetitionSchedule.qualifyingPeriodStartAt, 

                        // Competition Qualifying Close Timestamp
                        qualifyingPeriodCloseAt: ghostCompetitionSchedule.qualifyingPeriodCloseAt,

                        // Competition (Main Draw) Start Timestamp
                        competitionStartAt: ghostCompetitionSchedule.competitionStartAt, 

                        // Competition (Main Draw) Close Timestamp
                        competitionCloseAt: ghostCompetitionSchedule.competitionCloseAt, 

                        // Competition (Main Draw) End Timestamp
                        competitionEndAt: ghostCompetitionSchedule.competitionEndAt, 

                        // Competition (Main Draw) length per periods
                        lengthOfPeriod: ghostCompetitionSchedule.lengthOfPeriod, 

                        // Competition (Main Draw) interval (for tallying) per periods
                        lengthOfInterval: ghostCompetitionSchedule.lengthOfInterval, 

                        // Area for the Competition Event (GID_RUNAREA_*)
                        area: ghostCompetitionSchedule.area, 

                        // idk what this is
                        minigamePatternId: ghostCompetitionSchedule.minigamePatternId 
                    });
                }

                // Ghost Car Variable
                let ghostTargetCars: any;
                let ghostTargetTrails: number = 0;
                let ghostTargetplayedAt: number = date;

                // Current date is OCM main draw
                if(ghostCompetitionSchedule!.competitionStartAt < date && ghostCompetitionSchedule!.competitionCloseAt > date)
                {
                    console.log('Main Draw - Period: ' + period_id);

                    // Get Competition (OCM) Event Data for the car
                    let ghost_target_ocm = await ghost_ocm.competitionTargetMainDraw(ghostCompetitionSchedule!.dbId, period_id);

                    ghostTargetCars = ghost_target_ocm.ghostTargetCars;
                    ghostTargetTrails = ghost_target_ocm.trailId;
                    ghostTargetplayedAt = ghost_target_ocm.playedAt;
                }
                // Current date is OCM qualifying day
                else if(ghostCompetitionSchedule!.qualifyingPeriodStartAt < date && ghostCompetitionSchedule!.qualifyingPeriodCloseAt > date)
                {
                    console.log('Qualifying Day - Period: ' + period_id);

                    // Get Competition (OCM) Event Data for the car
                    let ghost_target_ocm = await ghost_ocm.competitionTargetQualifyingDay(ghostCompetitionSchedule!.dbId);

                    ghostTargetCars = ghost_target_ocm.ghostTargetCars;
                    ghostTargetTrails = ghost_target_ocm.trailId;
                    ghostTargetplayedAt = ghost_target_ocm.playedAt;
                }
                else
                {
                    console.log('End Day');

                    // Get Competition (OCM) Event Data for the car
                    let ghost_target_ocm = await ghost_ocm.competitionTargetEndDay(ghostCompetitionSchedule!.dbId, 999999999);

                    ghostTargetCars = ghost_target_ocm.ghostTargetCars;
                    ghostTargetplayedAt = ghost_target_ocm.playedAt;
                }

                // Response data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                    competitionId: competition_id,
                    specialGhostId: ghostCompetitionSchedule!.dbId,
                    ghostCar: ghostTargetCars,
                    trailId: ghostTargetTrails,
                    updatedAt: ghostTargetplayedAt,
                    competitionSchedule: competitionSchedule
                };

                // Encode the response
                let message = wm.v388.protobuf.GhostCompetitionTarget.encode(msg);

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