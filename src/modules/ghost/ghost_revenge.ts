import { prisma } from "../..";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";

// Send Challenge
export async function sendRevenge(body: v388.protobuf.SaveGameResultRequest)
{
    let rgResult = body.rgResult;

    if(rgResult)
    {
        let checkCar = await prisma.car.findFirst({
            where:{
                carId: rgResult.opponentCarId
            },
            include:{
                lastPlayedPlace: true
            }
        });

        if(checkCar)
        {
            if(rgResult.result > 0)
            {
                console.log('Send Challenge');
            }

            // Create Challenger data
            let dataChallenger: any = {
                carId: rgResult.opponentCarId,
                revengerCarId: body.carId,
                result: rgResult.result,
                area: rgResult.area,
                revengeLevel: 1,
                lastPlayedAt: body.playedAt
            }

            // Check revenge
            let revengeTarget = await prisma.ghostRevenger.findFirst({
                where:{
                    carId: body.carId,
                    revengerCarId: rgResult.opponentCarId,
                    area: rgResult.area
                }
            });

            // No record found
            if(!revengeTarget)
            {
                console.log('Creating new revenge entry');

                await prisma.ghostRevenger.create({
                    data: dataChallenger
                });
            }
        }
    }
}


// Return the Challenge
export async function returnRevenge(body: v388.protobuf.SaveGameResultRequest)
{
    let rgResult = body.rgResult;

    if(rgResult)
    {
        let checkCar = await prisma.car.findFirst({
            where:{
                carId: rgResult.opponentCarId,
            },
            include:{
                lastPlayedPlace: true
            }
        });

        if(checkCar)
        {
            if(rgResult.result > 0 && rgResult.revenged)
            {
                console.log('Returning Challenge');
            }

            // Return the Revenge
            let revengeTarget = await prisma.ghostRevenger.findFirst({
                where:{
                    carId: body.carId,
                    revengerCarId: rgResult.opponentCarId,
                    area: rgResult.area
                }
            });

            if(revengeTarget)
            {
                let revengeLevel = revengeTarget.revengeLevel + 1;
    
                let dataRevengeTarget: any = {
                    carId: rgResult.opponentCarId,
                    revengerCarId: body.carId,
                    revengeLevel: revengeLevel,
                }
                
                await prisma.ghostRevenger.update({
                    where:{
                        id: revengeTarget.id
                    },
                    data: dataRevengeTarget
                });

                let checkFriendCar = await prisma.friendCar.findFirst({
                    where: {
                        friendCarId: revengeTarget.carId 
                    }
                });

                if (!checkFriendCar) {
                    await prisma.friendCar.create({
                        data: {
                            carId: body.carId,
                            friendCarId: revengeTarget.carId,
                            friendshipLevel: 1,
                            revengeLevel: revengeLevel
                        }
                    });
                } else {
                    await prisma.friendCar.update({
                        where: {
                            dbId: checkFriendCar.dbId
                        },
                        data: {
                            revengeLevel: revengeLevel
                        }
                    });
                }
            }
        }
    }
}