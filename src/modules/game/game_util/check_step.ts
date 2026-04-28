// Import Proto
import { prisma } from "../../..";
import { v388 } from "../../../wmmt/v388.proto";

// Save story result
export async function checkCurrentStep(body: v388.protobuf.SaveGameResultRequest)
{
    // Get current step for updating the user's ghost level
    let currentStep = 0;
    currentStep = body.car!.tunePower! + body.car!.tuneHandling!; 

    // Set current ghost level based on current step
    let ghostLevel = 1;
    switch(currentStep)
    {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            ghostLevel = 1
            break;

        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
            ghostLevel = 2
            break;

        case 11:
        case 12:
        case 13:
        case 14:
        case 15:
            ghostLevel = 3
            break;

        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
            ghostLevel = 4
            break;

        case 21:
        case 22:
        case 23:
        case 24:
        case 25:
        case 26:
            ghostLevel = 5
            break;

        case 27:
        case 28:
            ghostLevel = 6
            break;
            
        case 29:
        case 30:
            ghostLevel = 7
            break;

        case 31:
            ghostLevel = 8
            break;
    
        case 32:
            ghostLevel = 9
            break;
    }

    let car = await prisma.car.findFirst({
        where: {
            carId: body.carId
        },
        select: {
            rgScore: true
        }
    });

    if (car?.rgScore! >= 1000)
    {
        ghostLevel = 10;
    }

    // Return the value to 'BASE_PATH/src/util/games/story.ts'
    return { ghostLevel }
}