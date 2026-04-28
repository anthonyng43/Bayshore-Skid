import { prisma } from "../..";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";
import * as wmproto from "../../wmmt/v388.proto";

// Import Util
import * as ghost_ocm from "./ghost_util/ghost_competition_tally";


// Competition (OCM) Calculating Period
export async function competitionCalculatingPeriod(ghostCompetitionSchedule: any) {
    let competitionPeriodStartTimestamp = ghostCompetitionSchedule.competitionStartAt;
    let competitionPeriodEndTimeStamp = 0;
    let period = 1;

    // Count how many period
    while (competitionPeriodStartTimestamp < ghostCompetitionSchedule.competitionCloseAt) {
        // Count period closing timestamp
        competitionPeriodEndTimeStamp = competitionPeriodStartTimestamp + ghostCompetitionSchedule.lengthOfPeriod;

        // competitionPeriodEndTimeStamp is more than competitionCloseAt
        if (competitionPeriodEndTimeStamp > ghostCompetitionSchedule.competitionCloseAt) {
            competitionPeriodEndTimeStamp = ghostCompetitionSchedule.competitionCloseAt;
        }

        // Insert to table
        await prisma.ghostCompetitionSchedulePeriod.create({
            data: {
                competitionDbId: ghostCompetitionSchedule.dbId,
                periodId: period,
                startAt: competitionPeriodStartTimestamp,
                closeAt: competitionPeriodEndTimeStamp
            }
        });

        period++;
        competitionPeriodStartTimestamp = competitionPeriodEndTimeStamp + ghostCompetitionSchedule.lengthOfInterval;
    }

    // Check the gap between quali close and main draw start timestamp
    let checkQualiMainGap = ghostCompetitionSchedule.competitionStartAt - ghostCompetitionSchedule.qualifyingPeriodCloseAt;

    // Make sure there is at least 1 hour gap
    if (checkQualiMainGap < 3600) {
        // Gap is less than 1 hour.. updating the gap to 1 hour or more
        let changeTime = ghostCompetitionSchedule.competitionStartAt - 3600;

        // Update the gap
        await prisma.ghostCompetitionSchedule.update({
            where: {
                dbId: ghostCompetitionSchedule.dbId
            },
            data: {
                qualifyingPeriodCloseAt: changeTime
            }
        })
    }

    console.log('Calculating Period Completed!');
}


// User Competition (OCM) Main Draw Data
export async function competitionInfoMainDraw(body: v388.protobuf.LoadGhostCompetitionInfoRequest, competition_db_id: number, periodId: number) {
    console.log("Competition ID: " + body.competitionId + ", Period ID: " + periodId);

    let qualified: boolean = false;
    let msg: any;

    // Get Competition (OCM) Tally Count
    let competitionTallyCount = await prisma.ghostCompetitionTally.count({
        where: {
            competitionId: competition_db_id,
            periodId: periodId
        }
    });

    // If not yet being tallied
    if (competitionTallyCount === 0) {
        await ghost_ocm.competitionTally(competition_db_id, periodId, false);
    }

    // Get all user record
    let ghostCompetitionTally = await prisma.ghostCompetitionBattleRecord.findMany({
        where: {
            competitionDbId: competition_db_id,
            periodId: periodId
        },
        orderBy: {
            result: 'desc'
        },
        distinct: ['carId'],
    });

    // Get user ranking
    let result = 0;
    let rank = 0;
    let topResults = [];

    for (let i = 0; i < ghostCompetitionTally.length; i++) {
        // User record found
        if (ghostCompetitionTally[i].carId == body.carId) {
            // Get main draw advantage (Current car advantage from qualifying day - Top 1 OCM Ghost advantage from qualifying day)
            result = ghostCompetitionTally![i].result;

            // Qualified to play main draw
            qualified = true;

            // Current Rank
            rank = i + 1;

            // Break the loop
            i = ghostCompetitionTally.length;
            break;
        }
        // Other user record move it to Top Result Ranking
        else {
            topResults.push(ghostCompetitionTally[i].result);
        }
    }

    // User is qualified to main draw
    if (qualified) {
        // Response data
        msg = {
            error: wmproto.v388.protobuf.ErrorCode.ERR_SUCCESS,
            periodId: periodId,
            closed: false,
            qualified: qualified,
            topResults: topResults,
            result: result,
            rank: rank
        };
    }
    // User is not playing Competition (OCM) Qualifying Day
    else {
        // Response data
        msg = {
            error: wmproto.v388.protobuf.ErrorCode.ERR_SUCCESS,
            periodId: periodId,
            closed: false, // true = user cannot enter Competition (OCM)
            qualified: false, // false = user cannot join Competition (OCM)
        };
    }

    return { msg }
}


// Competition (OCM) Target Main Draw
export async function competitionTargetMainDraw(competition_db_id: number, periodId: number) {
    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get No 1 (Target) main draw car data
    let ghostCompetitionTarget = await prisma.ghostCompetitionTarget.findFirst({
        where: {
            competitionDbId: competition_db_id,
            periodId: periodId
        }
    });
    let target_cars: any;
    let trailId = 0;
    let playedAt = date;
    let area, ramp;

    // Get No 1 (Target) main draw ghost trail id
    let ghostCompetitionTargetGhostTrail = await prisma.ghostCompetitionTargetGhostTrail.findFirst({
        where: {
            carId: ghostCompetitionTarget!.carId,
            competitionDbId: competition_db_id,
            periodId: periodId,
        }
    });

    // No 1 (Target) Ghost trail data available
    if (ghostCompetitionTargetGhostTrail) {
        // Get the Top 1 OCM car data
        target_cars = await prisma.car.findFirst({
            where: {
                carId: ghostCompetitionTarget!.carId
            },
            include: {
                lastPlayedPlace: true
            }
        });

        // Set the tunePower used when playing ghost crown
        target_cars.tunePower = ghostCompetitionTargetGhostTrail.tunePower;

        // Set the tuneHandling used when playing ghost crown
        target_cars.tuneHandling = ghostCompetitionTargetGhostTrail.tuneHandling;

        // Set Ghost stuff Value
        target_cars.lastPlayedAt = ghostCompetitionTargetGhostTrail.playedAt;
        trailId = ghostCompetitionTargetGhostTrail.dbId;

        // Set area
        area = ghostCompetitionTargetGhostTrail.area;
        ramp = ghostCompetitionTargetGhostTrail.ramp;

        // Other
        playedAt = target_cars!.lastPlayedAt;
    }

    // Push the Top 1 OCM ghost car data
    let ghostTargetCars = wmproto.v388.protobuf.GhostCar.create({
        car: target_cars,
        area: area,
        ramp: ramp,
        //nonhuman: false
    });

    return { ghostTargetCars, trailId, playedAt }
}


// User Competition (OCM) Qualifying Day Data
export async function competitionInfoQualifyingDay(body: v388.protobuf.LoadGhostCompetitionInfoRequest, competition_db_id: number) {
    let qualified: boolean = true;
    let msg: any;

    // Get user's ghost battle record versus Top 1 OCM ghost
    let userCompetitionBattleRecord = await prisma.ghostCompetitionBattleRecord.findFirst({
        where: {
            carId: body.carId,
            competitionDbId: competition_db_id,
            periodId: 0, // default period id for qualifying day
        }
    });

    // User already participating to Competition (OCM)
    if (userCompetitionBattleRecord) {
        // Mini game braking point
        let brakingPoint: number = 0;
        if (userCompetitionBattleRecord.brakingPoint !== null) {
            brakingPoint = Number(userCompetitionBattleRecord.brakingPoint);
        }

        // Distance from Target Ghost
        let result: any = Number(userCompetitionBattleRecord.result);

        // Response data
        msg = {
            error: wmproto.v388.protobuf.ErrorCode.ERR_SUCCESS,
            periodId: 0,
            closed: false,
            qualified: qualified,
            brakingPoint: brakingPoint,
            result: result
        };
    }
    // User haven't participating to Competition (OCM)
    else {
        // Response data
        msg = {
            error: wmproto.v388.protobuf.ErrorCode.ERR_SUCCESS,
            periodId: 0,
            closed: false, // true = user cannot enter Competition (OCM)
            qualified: true, // false = user cannot join Competition (OCM)
        };
    }

    return { msg }
}


// Competition (OCM) Target Qualifying Day
export async function competitionTargetQualifyingDay(competition_db_id: number) {
    // Declare Variable
    let targetCar: v388.protobuf.ICar | null;

    // Get target Qualifier OCM ghost trail
    let ghostTargetTrails = await prisma.ghostCompetitionDevGhostTrail.findFirst({
        where: {
            competitionDbId: competition_db_id,
            periodId: 0 // default period id for qualifying day
        }
    });

    // If Ghost Trail is found
    if (ghostTargetTrails) {

        targetCar = await prisma.car.findFirst({
            where: {
                carId: ghostTargetTrails!.carId
            },
            include: {
                lastPlayedPlace: true
            }
        });
    }

    // Push the Qualifier OCM ghost car data
    let ghostTargetCars = wmproto.v388.protobuf.GhostCar.create({
        car: {
            ...targetCar!,
            tunePower: ghostTargetTrails?.tunePower!,
            tuneHandling: ghostTargetTrails?.tuneHandling!,
        },
        area: ghostTargetTrails?.area!,
        ramp: ghostTargetTrails?.ramp!,
        //nonhuman: false
    });

    let trailId: number = ghostTargetTrails?.dbId!;
    let playedAt: number = ghostTargetTrails?.playedAt!;

    return { ghostTargetCars, trailId, playedAt }
}


// User Competition (OCM) Main Draw Data
export async function competitionEndDay(body: v388.protobuf.LoadGhostCompetitionInfoRequest, competition_db_id: number) {
    console.log("Competition ID: " + body.competitionId + ", End Day");

    // Get Competition (OCM) Tally Count
    let competitionTallyCount = await prisma.ghostCompetitionTally.count({
        where: {
            competitionId: competition_db_id,
            periodId: 999999999
        }
    });

    // If not yet being tallied
    if (competitionTallyCount === 0) {
        await ghost_ocm.competitionTally(competition_db_id, 999999999, true);

        // Give Competition (OCM) Plate Reward
        await ghost_ocm.competitionGiveNamePlateReward(body.competitionId, competition_db_id);
    }

    // Response data
    let msg = {
        error: wmproto.v388.protobuf.ErrorCode.ERR_SUCCESS,
        periodId: 999999999,
        closed: true, // true = user cannot enter Competition (OCM)
        qualified: false, // false = user cannot join Competition (OCM)
    };

    return { msg }
}


// Competition (OCM) Target End Day
export async function competitionTargetEndDay(competition_db_id: number, periodId: number) {
    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get No 1 (Target) main draw car data
    let ghostCompetitionTarget = await prisma.ghostCompetitionTarget.findFirst({
        where: {
            competitionDbId: competition_db_id,
            periodId: periodId
        }
    });
    let target_cars: any;
    let playedAt = date;
    let area, ramp;

    // Get No 1 (Target) main draw ghost trail id
    let ghostCompetitionTargetGhostTrail = await prisma.ghostCompetitionTargetGhostTrail.findFirst({
        where: {
            carId: ghostCompetitionTarget!.carId,
            competitionDbId: competition_db_id,
            periodId: periodId,
        }
    });

    // No 1 (Target) Ghost trail data available
    if (ghostCompetitionTargetGhostTrail) {
        // Get the Top 1 OCM car data
        target_cars = await prisma.car.findFirst({
            where: {
                carId: ghostCompetitionTarget!.carId
            },
            include: {
                lastPlayedPlace: true
            }
        });

        // Set the tunePower used when playing ghost crown
        target_cars.tunePower = ghostCompetitionTargetGhostTrail.tunePower;

        // Set the tuneHandling used when playing ghost crown
        target_cars.tuneHandling = ghostCompetitionTargetGhostTrail.tuneHandling;

        // Set Ghost stuff Value
        target_cars.lastPlayedAt = ghostCompetitionTargetGhostTrail.playedAt;

        // Set area
        area = ghostCompetitionTargetGhostTrail.area;
        ramp = ghostCompetitionTargetGhostTrail.ramp;

        // Other
        playedAt = target_cars!.lastPlayedAt;
    }

    // Push the Top 1 OCM ghost car data
    let ghostTargetCars = wmproto.v388.protobuf.GhostCar.create({
        car: target_cars,
        area: area,
        ramp: ramp,
        //nonhuman: false,
    });

    return { ghostTargetCars, playedAt }
}