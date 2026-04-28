import { prisma } from "../..";
import Long from "long";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";

// Import Util
import * as common from "../util/common";
import * as check_step from "./game_util/check_step";

// Save story result
export async function saveStoryResult(body: v388.protobuf.SaveGameResultRequest, car: any)
{
    // If the game was not retired / timed out
    if (!(body.retired || body.timeup))
    {
        console.log('Game not retired / timed out, continuing ...')

        // Get the story result for the car
        let storyResult = body?.stResult;
        let stLoseBits;

        // storyResult is set
        if (storyResult)
        {
            // Story update data
            let data : any = {
                stClearDivCount: common.sanitizeInputNotZero(storyResult.stClearDivCount), 
                stPlayCount: common.sanitizeInput(storyResult.stPlayCount), 
                stClearCount: common.sanitizeInputNotZero(storyResult.stClearCount), 
                stConsecutiveWins: common.sanitizeInput(storyResult.stConsecutiveWins), 
                tuningPoint: common.sanitizeInput(storyResult.tuningPoint),
                ownedBgm: common.sanitizeInput(storyResult.ownedBgm),
                ownedMeters: common.sanitizeInput(storyResult.ownedMeters)
            }

            // If the current consecutive wins is greater than the previous max
            if (storyResult.stConsecutiveWins! > car!.stConsecutiveWinsMax) 
            {
                // Update the maximum consecutive wins;
                data.stConsecutiveWinsMax = storyResult.stConsecutiveWins;
            }

            // If the lose bits are set, and are long data
            if (Long.isLong(storyResult.stLoseBits))
            {
                // Convert them to BigInt and add to the data
                data.stLoseBits = common.getBigIntFromLong(storyResult.stLoseBits);
                stLoseBits = data.stLoseBits;

                // If a loss has been recorded
                if (stLoseBits > 0)
                {
                    // End the win streak
                    data.stConsecutiveWins = 0;
                }
            }
            else
            {
                stLoseBits = 0;
            }

            // Calling check step function (BASE_PATH/src/util/games/games_util/check_step.ts)
            let check_steps = await check_step.checkCurrentStep(body);

            // Set the ghost level to the correct level
            data.ghostLevel = check_steps.ghostLevel;

            // Check if clearBits is not null, and not lose the story
            if(storyResult.stClearBits !== null && storyResult.stClearBits !== undefined)
            {
                if(stLoseBits === 0) 
                {
                    data.stClearBits = storyResult.stClearBits;
                }
            }
            
            if(data.stClearCount || stLoseBits)
            {
                console.log('Updating story data');
                
                // Update the car properties
                await prisma.car.update({
                    where: {
                        carId: body.carId
                    },
                    data: data
                });
            }
        }
    }
}