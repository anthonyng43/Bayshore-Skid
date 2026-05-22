import { Config } from "../../../config";
import { prisma } from "../../..";

// Import Proto
import { v388 } from "../../../wmmt/v388.proto";

// Import Util
import * as common from "../../util/common";
import * as ghost_revenge from "../../ghost/ghost_revenge";


// Save ghost battle record
export async function saveGhostBattleRecord(body: v388.protobuf.SaveGameResultRequest)
{
    console.log('Saving Ghost Battle Record');
    
    let updateNewTrail : boolean = true;
    let crownModePlay : boolean = false;
    let saveExGhostHistory: any = {};

    // Get the car result for the car
    let car = body?.car;

    if(car)
    {
        saveExGhostHistory = {
            carId: common.sanitizeInput(body.carId),
            tunePower: common.sanitizeInput(car.tunePower),
            tuneHandling: common.sanitizeInput(car.tuneHandling),
            playedAt: common.sanitizeInputNotZero(body.playedAt),
            playedShopName: Config.getConfig().shopName
        }
    }

    // Get the rg result for the car
    let rgResult = body?.rgResult;

    if(rgResult)
    {
        let getCrown = await prisma.ghostCrown.findFirst({
            where: {
                carId: rgResult.opponentCarId,
                area: rgResult.area
            }
        });

        if (getCrown) 
        {
            crownModePlay = true;

            let checkCrown = await prisma.ghostCrown.count({
                where: {
                    area: rgResult.area
                }
            });

            if (checkCrown > 0)
            {
                await prisma.ghostCrown.update({ 
                    where: {
                        area: rgResult.area
                    },
                    data: {
                        carId: common.sanitizeInput(body.carId),
                        playedAt: common.sanitizeInput(body.playedAt),
                        tunePower: common.sanitizeInput(body.car?.tunePower),
                        tuneHandling: common.sanitizeInput(body.car?.tuneHandling),
                    }
                });
            }
        }
        
        saveExGhostHistory.area = rgResult.area;
        saveExGhostHistory.opponentCarId = rgResult.opponentCarId;
        saveExGhostHistory.opponentResult = rgResult.result;
    }

    if (rgResult?.result! > 0) {
        saveExGhostHistory.opponentResult = -Math.abs(rgResult?.result!);
    } else if (rgResult?.result! < 0) {
        saveExGhostHistory.opponentResult = +Math.abs(rgResult?.result!);
    }

    // Only create ghost battle record if opponent is not generated ones
    let opponentCar = await prisma.car.findFirst({
        where: {
            carId: rgResult?.opponentCarId
        }
    });

    if (opponentCar)
    {
        // check opponent records
        let recordCount = await prisma.ghostBattleRecord.count({
            where: {
                opponentCarId: rgResult?.opponentCarId
            },
            orderBy: {
                playedAt: 'desc'
            }
        });

        if (recordCount <= 10) {
            let getRecord = await prisma.ghostBattleRecord.findFirst({
                where: {
                    carId: body.carId,
                    opponentCarId: rgResult?.opponentCarId
                }
            });

            if (getRecord) {
                await prisma.ghostBattleRecord.update({
                    where: {
                        dbId: getRecord.dbId
                    },
                    data: saveExGhostHistory
                });
            } else {
                await prisma.ghostBattleRecord.create({
                    data: saveExGhostHistory
                });
            }
        } else {
            let getRecord = await prisma.ghostBattleRecord.findFirst({
                where: {
                    carId: body.carId,
                    opponentCarId: rgResult?.opponentCarId
                }
            });

            if (getRecord) {
                await prisma.ghostBattleRecord.update({
                    where: {
                        dbId: getRecord.dbId
                    },
                    data: saveExGhostHistory
                });
            } else {
                let records = await prisma.ghostBattleRecord.findMany({
                    where: {
                        opponentCarId: rgResult?.opponentCarId
                    },
                    orderBy: {
                        playedAt: 'desc'
                    }
                });

                await prisma.ghostBattleRecord.delete({
                    where: {
                        dbId: records[9].dbId
                    }
                });

                await prisma.ghostBattleRecord.create({
                    data: saveExGhostHistory
                });
            }
        }

        if (body.rgResult?.opponentTeamId != null && body.rgResult?.opponentTeamId! != 0) {
            let getSticker = await prisma.teamStickersEarned.findFirst({
                where: {
                    teamId: body.car?.teamId!,
                    opponentTeamId: body.rgResult?.opponentTeamId!
                }
            });

            if (getSticker) {
                await prisma.teamStickersEarned.update({
                    where: {
                        dbId: getSticker.dbId
                    },
                    data: {
                        count: getSticker.count + 1
                    }
                });
            } else {
                await prisma.teamStickersEarned.create({
                    data: {
                        teamId: body.car?.teamId!,
                        opponentTeamId: body.rgResult?.opponentTeamId!,
                        count: 1,
                        earnedAt: body.playedAt
                    }
                });
            }
        }

        if (rgResult?.revenged) {
            await ghost_revenge.returnRevenge(body);
        } else {
            await ghost_revenge.sendRevenge(body);
        }
    }

    // Return the value to 'BASE_PATH/src/util/games/ghost.ts'
    return { updateNewTrail, crownModePlay}
}

// Save Competition (OCM) ghost battle record
export async function saveCompetitionGhostRecord(body: v388.protobuf.SaveGameResultRequest)
{
    console.log('Saving Competition (OCM) Ghost Battle Record');

    let updateNewTrail: boolean = true;
    let competitionModePlay: boolean = true;
    let dataUser: any;
    let dataResult: any;

    // Get the car result for the car
    let car = body?.car;

    if(car)
    {
        dataUser = {
            carId: common.sanitizeInput(car.carId),
            name: common.sanitizeInput(car.name),
            regionId: common.sanitizeInput(car.regionId),
            model: common.sanitizeInput(car.model),
            visualModel: common.sanitizeInput(car.visualModel),
            defaultColor: common.sanitizeInput(car.defaultColor),
            title: common.sanitizeInput(car.title),
            level: common.sanitizeInput(car.level),
            playedAt: common.sanitizeInputNotZero(body.playedAt),
            playedShopName: Config.getConfig().shopName
        }
    }

    // Get the rg result for the car
    let rgResult = body?.rgResult;

    if(rgResult)
    {
        dataResult = {
            result: common.sanitizeInput(rgResult.result) || -999999999,
            brakingPoint: common.sanitizeInput(rgResult.brakingPoint) || 0,
        }
    }

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get currently active OCM event
    let ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({ 
        where: {
            // qualifyingPeriodStartAt is less than current date
            qualifyingPeriodStartAt: { lte: date },

            // competitionEndAt is greater than current date
            competitionEndAt: { gte: date },
        }
    });

    // Get available OCM Record (Qualifying or Main Draw)
    let getUserCompetitionRecord = await prisma.ghostCompetitionBattleRecord.findFirst({ 
        where: {
            carId: dataUser.carId,
            competitionDbId: ghostCompetitionSchedule!.dbId,
        }
    });
    
    // User have OCM Battle Record data available
    if(getUserCompetitionRecord)
    {
        console.log('OCM Ghost Battle Record found');

        // Check if the newest advantage distance is bigger than the older advantage distance
        if(getUserCompetitionRecord.result < dataResult.result)
        {
            console.log('Updating OCM Ghost Battle Record entry');

            // Current date is Competition (OCM) Main Draw
            if(ghostCompetitionSchedule!.competitionStartAt < date && ghostCompetitionSchedule!.competitionCloseAt > date)
            {
                // Get OCM Period ID
                let competitionPeriodId = await prisma.ghostCompetitionSchedulePeriod.findFirst({ 
                    where: {
                        competitionDbId: ghostCompetitionSchedule!.dbId,
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

                // Period ID not found
                if(!competitionPeriodId)
                {
                    competitionPeriodId = await prisma.ghostCompetitionSchedulePeriod.findFirst({ 
                        where: {
                            competitionDbId: ghostCompetitionSchedule!.dbId,
                            startAt: 
                            {
                                lte: date - ghostCompetitionSchedule!.lengthOfInterval, // competitionStartAt is less than current date
                            },
                            closeAt:
                            {
                                gte: date - ghostCompetitionSchedule!.lengthOfInterval, // competitionCloseAt is greater than current date
                            }
                        },
                        select: {
                            periodId: true
                        }
                    });
                }

                // Update Competition (OCM) Ghost Battle record
                await prisma.ghostCompetitionBattleRecord.update({
                    where: {
                        dbId: getUserCompetitionRecord!.dbId
                    },
                    data: {
                        ...dataUser,
                        ...dataResult,
                        competitionDbId: ghostCompetitionSchedule!.dbId,
                        periodId: competitionPeriodId!.periodId
                    }
                });
            }
            // Current date is Competition (OCM) Qualifying
            else
            {
                // Update Competition (OCM) ghost battle record
                await prisma.ghostCompetitionBattleRecord.update({
                    where: {
                        dbId: getUserCompetitionRecord.dbId
                    },
                    data: {
                        ...dataUser,
                        ...dataResult,
                        competitionDbId: ghostCompetitionSchedule!.dbId,
                        periodId: Number(0)
                    }
                });
            }
        }
        // Newest advantage distance is lower than the older advantage distance
        else
        { 
            console.log('Result record is lower than previous record');

            // Don't update the User's OCM ghost trail
            updateNewTrail = false; 
        }
    }
    // User don't have Competition (OCM) Battle Record data
    else
    {
        console.log('OCM Ghost Battle Record not found');
        console.log('Creating new OCM Ghost Battle Record entry');

        // Current date is Competition (OCM) Main Draw
        if(ghostCompetitionSchedule!.competitionStartAt < date && ghostCompetitionSchedule!.competitionCloseAt > date)
        {
            // Get OCM Period ID
            let competitionPeriodId = await prisma.ghostCompetitionSchedulePeriod.findFirst({ 
                where: {
                    competitionDbId: ghostCompetitionSchedule!.dbId,
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

            // Period ID not found
            if(!competitionPeriodId)
            {
                competitionPeriodId = await prisma.ghostCompetitionSchedulePeriod.findFirst({ 
                    where: {
                        competitionDbId: ghostCompetitionSchedule!.dbId,
                        startAt: 
                        {
                            lte: date - ghostCompetitionSchedule!.lengthOfInterval, // competitionStartAt is less than current date
                        },
                        closeAt:
                        {
                            gte: date - ghostCompetitionSchedule!.lengthOfInterval, // competitionCloseAt is greater than current date
                        }
                    },
                    select: {
                        periodId: true
                    }
                });
            }

            // Update ghost battle record
            await prisma.ghostCompetitionBattleRecord.create({
                data: {
                    ...dataUser,
                    ...dataResult,
                    competitionDbId: ghostCompetitionSchedule!.dbId,
                    periodId: competitionPeriodId!.periodId
                }
            });
        }
        // Current date is Competition (OCM) Qualifying
        else
        {
            // Create ghost battle record
            await prisma.ghostCompetitionBattleRecord.create({
                data: {
                    ...dataUser,
                    ...dataResult,
                    competitionDbId: ghostCompetitionSchedule!.dbId,
                    periodId: 0
                }
            });

            // Update carState
            await prisma.carState.update({
                where: {
                    dbId: car?.carId!
                },
                data: {
                    competitionState: 3, // Participated
                }
            });
        }
    }

    // Return the value
    return { updateNewTrail, competitionModePlay }
}