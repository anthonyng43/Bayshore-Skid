import { prisma } from "../..";

// Get Competiiton (OCM) ghost trail
export async function getCompetitionGhostTrail(carId: number, trailId: number)
{
    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get Competition (OCM) Event Date
    let ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({
        where: {
            // qualifyingPeriodStartAt is less than current date
            qualifyingPeriodStartAt: { lte: date },

            // competitionEndAt is greater than current date
            competitionEndAt: { gte: date },
        }
    });
    let competition_id = ghostCompetitionSchedule!.competitionId;

    // Get the trail data for certain area
    let ghost_trails;

    // Qualifying Target Ghost
    if(ghostCompetitionSchedule!.qualifyingPeriodStartAt < date && ghostCompetitionSchedule!.qualifyingPeriodCloseAt > date)
    {
        console.log('Competition (OCM) Dev Ghost Detected');

        ghost_trails = await prisma.ghostCompetitionDevGhostTrail.findFirst({
            where: {
                dbId: trailId,
                carId: carId,
                competitionDbId: competition_id
            }
        });
    }
    // Main Draw Target Ghost
    else
    {
        console.log('Competition (OCM) Player Target Ghost Detected');

        ghost_trails = await prisma.ghostCompetitionTargetGhostTrail.findFirst({
            where: {
                dbId: trailId,
                carId: carId,
                competitionDbId: competition_id
            }
        });
    }

    // Variable for ghost car
    let area: number = 0;
    let ramp: number = 0;
    let playedAt: number = date;
    let ghostTrail;

    // Ghost trail found
    if(ghost_trails)
    {
        console.log('Competition (OCM) Ghost Trail found');

        // Set the ramp id
        ramp = ghost_trails.ramp;

        // Get target car last played
        let targetLastPlayedAt = await prisma.ghostCompetitionTargetGhostTrail.findFirst({
            where: {
                carId: carId,
                competitionDbId: competition_id
            },
            select: {
                playedAt: true
            }
        });

        // Last played found
        if(targetLastPlayedAt)
        {
            date = Number(targetLastPlayedAt.playedAt);
            playedAt = date;
        }

        // Set to car ghost trails data
        ghostTrail = ghost_trails!.trail;
    }

    return { area, ramp, playedAt, ghostTrail }
}


// Get Crown Ghost Trail
export async function getTrail(carId: number, area: number)
{
    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    let ghost_trail = await prisma.ghostTrail.findFirst({
        where:{
            carId: carId,
            area: area
        },
        orderBy:{
            playedAt: 'desc'
        }
    });

    // Variable for ghost car
    let ramp = 0;
    let playedAt = 0;
    let ghostTrail: Uint8Array;
    // Ghost trail found
    if (ghost_trail)
    {
        console.log('Ghost Trail found');

        // Ghost value
        area = ghost_trail.area;
        ramp = ghost_trail.ramp;
        playedAt = ghost_trail.playedAt;
        ghostTrail = ghost_trail.trail;
    }
    // Default Ghost trail
    else
    {
        // Default value
        playedAt = date;
        ghostTrail = new Uint8Array;

        switch (area)
        {
            case 0:
                // C1
                ramp = Math.floor(Math.random() * 4);
                break;

            case 1:
                // K9
                ramp = Math.floor(Math.random() * 2) + 4;
                break;

            case 2:
                // Wangan
                ramp = Math.floor(Math.random() * 4) + 6;
                break;

            case 3:
                // Yokohane
                ramp = Math.floor(Math.random() * 4) + 10;
                break;

            case 4:
                // Yaesu
                ramp = Math.floor(Math.random() * 3) + 14;
                break;

            case 5:
                // Minato Mirai
                ramp = Math.floor(Math.random() * 4) + 17;
                break;

            case 6:
                // Nagoya
                ramp = 21
                break;

            case 7:
                // Osaka
                ramp = 22
                break;

            case 8:
                // Fukuoka
                ramp = Math.floor(Math.random() * 4) + 23;
                break;

            case 9:
                // Hakone
                ramp = Math.floor(Math.random() * 2) + 27;
                break;
        }
    }

    return { area, ramp, playedAt, ghostTrail }
}
