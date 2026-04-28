import { Config } from "../../config";
import { prisma} from "../..";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";
import * as wmproto from "../../wmmt/v388.proto";

// User not yet Exist
export async function userNotYetExist(body: v388.protobuf.LoadUserRequest, message: any)
{
    let msg = message;
    
    // Check if new card registration is allowed or not
    let newCardsBanned = Config.getConfig().gameOptions.newCardsBanned || 0;

    // New card registration is allowed
    if(newCardsBanned === 0)
    {
        // Create User Data
        await prisma.user.create({
            data: {
                chipId: body.cardChipId,
                accessCode: body.accessCode,
                tutorials: 0,
                competitionUserState: 1,
                teamId: 0
            }
        });

        console.log('user made');
    }
    // New card registration is not allowed / closed
    else
    {
        console.log('New card / user registration is closed');
        
        msg.error = wmproto.v388.protobuf.ErrorCode.ERR_REQUEST;
    }

    return { msg }
}

// Check User's Car Order
export async function getCarOder(user: any)
{
    // If the car order array has not been created
    if (user.carOrder.length > 0)
    {
        // Sort the player's car list using the car order property
        user.cars = user.cars.sort(function(a: any, b: any)
        {
            // User, and both car IDs exist
            if (user)
            {
                // Compare both values using the car order array
                let compare: number = user?.carOrder.indexOf(a!.carId) - user?.carOrder.indexOf(b!.carId);

                // Return the comparison
                return compare;
            }
            else // Car IDs not present in car order list
            {
                throw Error("UserNotFoundException");
            }
        });
    }
    else // Car order undefined
    {
        // We will define it here
        let carOrder : number[] = [];

        // Loop over all of the user cars
        for(let car of user.cars)
        {
            // Add the car id to the list
            carOrder.push(car.carId);
        }

        // Update the car id property for the user
        await prisma.user.update({
            where: {
                id: user.id
            }, 
            data: {
                carOrder: carOrder
            }
        })
    }
}

// Check Competition (OCM) Participation State
export async function competitionParticipation(msg: any, msgCars: any, carStates: any)
{
    // Get the competition state
    let competitionUserState = wmproto.v388.protobuf.GhostCompetitionParticipantState.COMPETITION_NOT_PARTICIPATED;

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get current active Competiton (OCM) Event
    let ghostCompetitionSchedule = await prisma.ghostCompetitionSchedule.findFirst({
        where: {
            // qualifyingPeriodStartAt is less than current date
            qualifyingPeriodStartAt: { lte: date },

            // competitionEndAt is greater than current date
            competitionEndAt: { gte: date },
        }
    });

    if(ghostCompetitionSchedule)
    {
        // Check each car record
        for(let i=0; i<msgCars.length; i++)
        {
            let checkState = await prisma.carState.findFirst({
                where:{
                    dbId: msgCars[i].carId
                }
            });

            carStates[i].competitionState = checkState?.competitionState;
            competitionUserState = checkState?.competitionState!;
        }
    }

    // Check Competition (OCM) HoF Ghost Registered from Terminal for each car record
    for(let i=0; i<msgCars.length; i++)
    {
        let checkRegisteredGhost = await prisma.carState.findFirst({
            where:{
                dbId: msgCars[i].carId
            }
        });

        carStates[i].hasOpponentGhost = checkRegisteredGhost?.hasOpponentGhost;
    }

    return { competitionUserState, carStates }
}