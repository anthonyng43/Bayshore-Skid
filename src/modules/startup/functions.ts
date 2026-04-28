import { prisma } from "../..";

// Import Proto
import * as wm from "../../wmmt/service.proto";

// Get Competition (OCM) Schedule
export async function competitionSchedule(date: any, competitionId: any)
{
    // Get the Competition (OCM) schedule
    let ghostCompetitionSchedule;

    // Request by compedtitionId
    if(competitionId)
    {
        ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({
            where: {
                competitionId: competitionId
            },
            orderBy: {
                dbId: 'desc'
            }
        });
    }
    // Request by date
    else
    {
        ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({
            where: {
                // qualifyingPeriodStartAt is less than current date
                qualifyingPeriodStartAt: { lte: Number(date) },
    
                // competitionEndAt is greater than current date
                competitionEndAt: { gte: Number(date) },
            }
        });
    }

    // Other variable
    let competitionSchedule;
    let lastCompetitionId = null;
    let additionalCompetitionMsg = {};

    // Currently no Active Competition (OCM) Event.. Getting Previous Competition (OCM) Event
    let pastEvent = 0;
    if(!ghostCompetitionSchedule)
    {
        ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({
            orderBy:{
                dbId: 'desc'
            }
        });

        pastEvent = 1;
    }
    
    // Previous / Current Competition (OCM) available
    if(ghostCompetitionSchedule)
    {
        let pastDay = date - ghostCompetitionSchedule.competitionEndAt;

        if(pastDay < 604800)
        {
            // Creating GhostCompetitionSchedule
            competitionSchedule = wm.v388.protobuf.GhostCompetitionSchedule.create({ 

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

                // Type of Patterns
                minigamePatternId: ghostCompetitionSchedule.minigamePatternId 
            });

            // HOF menu while OCM is ongoing
            if(ghostCompetitionSchedule.competitionId > 1) {
                lastCompetitionId = ghostCompetitionSchedule.competitionId -1;
            }
        }

        // It's previous Competition (OCM) event
        if(pastEvent === 1)
        {
            lastCompetitionId = ghostCompetitionSchedule.competitionId;
        }

        // Competition (OCM) Response Message
        additionalCompetitionMsg = {
            latestCompetitionId: lastCompetitionId,
            competitionSchedule: competitionSchedule,
        }
    }

    return { additionalCompetitionMsg, competitionSchedule }
}