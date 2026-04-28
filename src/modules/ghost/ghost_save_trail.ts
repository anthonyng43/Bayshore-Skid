import { prisma } from "../..";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";

// Import Util
import * as common from "../../modules/util/common";


// Save Competition (OCM) ghost trail
export async function saveCompetitionGhostTrail(body: v388.protobuf.RegisterGhostTrailRequest)
{
    console.log('Saving Competition (OCM) Ghost Battle Trail');

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get current active Competition (OCM) Event
    let ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({
        where: {
            // qualifyingPeriodStartAt is less than current date
            qualifyingPeriodStartAt: { lte: date },

            // competitionEndAt is greater than current date
            competitionEndAt: { gte: date },
        },
        orderBy: {
            competitionId: 'desc'
        },
    });

    // Competition (OCM) Event Available
    if(ghostCompetitionSchedule)
    {
        // Default period
        let periodId = 0;

        // Current date is main draw
        if(ghostCompetitionSchedule.competitionStartAt < date && ghostCompetitionSchedule.competitionCloseAt > date)
        {
            // Get current Competition (OCM) Period ID
            let competitionPeriodId = await prisma.ghostCompetitionSchedulePeriod.findFirst({ 
                where:{
                    competitionDbId: ghostCompetitionSchedule.dbId,

                    // StartAt is less than current date
                    startAt: { lte: date },

                    // CloseAt is greater than current date
                    closeAt: { gte: date }
                },
                select:{
                    periodId: true
                }
            });

            periodId = competitionPeriodId?.periodId || 1;
        }

        // Get the ghost result for the car
        let ghostResult = body?.ghost;

        // Declare data
        let data: any;

        // ghostResult is set
        if(ghostResult)
        {
            // Ghost update data
            let area: number = ghostResult.area || 0;
            let ramp: number = ghostResult.ramp || 0;

            data = {
                carId: Number(ghostResult.car.carId),
                area: area,
                ramp: ramp,
                trail: common.sanitizeInput(body.trail),
                competitionDbId: common.sanitizeInput(ghostCompetitionSchedule.dbId),
                periodId: common.sanitizeInput(periodId),
                playedAt: common.sanitizeInputNotZero(ghostResult.car.lastPlayedAt) || date,
                tunePower: common.sanitizeInput(ghostResult.car.tunePower),
                tuneHandling: common.sanitizeInput(ghostResult.car.tuneHandling),
            }

            // Check Available Ghost Trail
            let checkCompetitionGhostTrail = await prisma.ghostCompetitionGhostTrail.findFirst({
                where:{
                    carId: data.carId,
                    competitionDbId: ghostCompetitionSchedule.dbId,
                },
                orderBy: {
                    playedAt: 'desc'
                }
            });

            // Record exist, update it
            if(checkCompetitionGhostTrail)
            {
                console.log('Competition (OCM) Ghost Trail history found');
                console.log('Updating Competition (OCM) ghost trail to the newest trail');

                // Update the data
                await prisma.ghostCompetitionGhostTrail.update({
                    where: {
                        dbId: checkCompetitionGhostTrail.dbId
                    },
                    data: data
                });
            }
            // Record does not exist, create new
            else
            {
                console.log('No Competition (OCM) ghost trail history');
                console.log('Creating new Competition (OCM) ghost trail entry');

                // Create new data
                await prisma.ghostCompetitionGhostTrail.create({
                    data: data
                });
            }
        }
    }
}


// Save Crown ghost trail
export async function saveCrownGhostTrail(body: v388.protobuf.RegisterGhostTrailRequest)
{
    console.log('Checking Crown Ghost Battle trail history');

    // Get the ghost result for the car
    let ghostResult = body?.ghost;

    // Declare data
    let data: any;

    // ghostResult is set
    if (ghostResult)
    {
        // Ghost update data
        let area: number = 0;
        let ramp: number = 0;

        if(ghostResult.area)
        {
            area = Number(ghostResult.area);
        }
        if(ghostResult.ramp)
        {
            ramp = Number(ghostResult.ramp);
        }
        
        data = {
            carId: Number(ghostResult.car.carId),
            area: area,
            ramp: ramp,
            trail: common.sanitizeInput(body.trail),
            playedAt: common.sanitizeInput(ghostResult.car.lastPlayedAt),
            tunePower: common.sanitizeInput(ghostResult.car.tunePower),
            tuneHandling: common.sanitizeInput(ghostResult.car.tuneHandling),
            crownBattle: true,
        }

        // Check Crown Ghost Battle Record if playing Crown Ghost Battle Mode
        let checkGhostTrail = await prisma.ghostTrail.findFirst({
            where:{
                area: ghostResult.area!,
                crownBattle: true,
            },
            orderBy: {
                playedAt: 'desc'
            }
        });

        // Record exist, update it
        if(checkGhostTrail)
        {
            console.log('Crown Trail history found');
            console.log('Updating crown trail to the newest trail');

            // Update the data
            await prisma.ghostTrail.update({
                where: {
                    dbId: checkGhostTrail.dbId
                },
                data: data
            });
        }
        // Record does not exist, create new
        else
        {
            console.log('No crown trail history');
            console.log('Creating new crown trail entry');

            // Create new data
            await prisma.ghostTrail.create({
                data: data
            });
        }

        // Update crown randomized ramp and path to the correct value
        console.log('Updating crown\'s area records to the correct value');
        await prisma.ghostCrown.update({
            where: {
                area: ghostResult.area!
            },
            data: {
                playedAt: ghostResult.car.lastPlayedAt!
            }
        });
    }
}


// Save Normal ghost trail
export async function saveNormalGhostTrail(body: v388.protobuf.RegisterGhostTrailRequest)
{
    console.log('Checking Normal Ghost Battle trail history');

    // Get the ghost result for the car
    let ghostResult = body?.ghost;

    // Declare data
    let data: any;

    // ghostResult is set
    if (ghostResult)
    {
        // Ghost update data
        let area: number = 0;
        let ramp: number = 0;
        if(ghostResult.area)
        {
            area = Number(ghostResult.area);
        }
        if(ghostResult.ramp)
        {
            ramp = Number(ghostResult.ramp);
        }
        
        data = {
            carId: Number(ghostResult.car.carId),
            area: area,
            ramp: ramp,
            trail: common.sanitizeInput(body.trail),
            playedAt: common.sanitizeInput(ghostResult.car.lastPlayedAt),
            tunePower: common.sanitizeInput(ghostResult.car.tunePower),
            tuneHandling: common.sanitizeInput(ghostResult.car.tuneHandling),
            crownBattle: false
        }

        // Check Normal Ghost Battle Record if playing Crown Ghost Battle Mode
        let checkGhostTrail = await prisma.ghostTrail.findFirst({
            where: {
                carId: ghostResult.car.carId!,
                area: ghostResult.area!
            },
            orderBy: {
                playedAt: 'desc'
            }
        });

        // Record exist, update it
        if(checkGhostTrail)
        {
            console.log('Trail history found');
            console.log('Updating trail to the newest trail');

            // Update the data
            await prisma.ghostTrail.update({
                where: {
                    dbId: checkGhostTrail.dbId
                },
                data: data
            });
        }
        // Record does not exist, create new
        else
        {
            console.log('No trail history');
            console.log('Creating new trail entry');

            // Create new data
            await prisma.ghostTrail.create({
                data: data
            });
        }
    }
}


// Save car path and tuning
export async function savePathAndTuning(body: v388.protobuf.RegisterGhostTrailRequest)
{
    console.log('Saving Car Path and Tuning');

    // Get the ghost result for the car
    let ghostResult = body?.ghost;

    // Declare data
    let data: any;

    // ghostResult is set
    if (ghostResult)
    {
        // Ghost update data
        let area: number = 0;
        let ramp: number = 0;
        if(ghostResult.area)
        {
            area = Number(ghostResult.area);
        }
        if(ghostResult.ramp)
        {
            ramp = Number(ghostResult.ramp);
        }

        data = {
            carId: Number(ghostResult.car.carId),
            area: area,
            ramp: ramp,
            tunePower: common.sanitizeInput(ghostResult.car.tunePower),
            tuneHandling: common.sanitizeInput(ghostResult.car.tuneHandling),
            lastPlayedAt: common.sanitizeInput(ghostResult.car.lastPlayedAt)
        }
    }
}