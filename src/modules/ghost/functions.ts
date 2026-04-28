import { Config } from "../../config";
import { prisma } from "../..";

// Import Proto
import * as wmproto from "../../wmmt/v388.proto";

// Import Util
import * as ghost_default_car from "../util/ghost_default_car";

// Get Challenged Opponent History
export async function getOpponentHistory(carId: number)
{
    // Get Opponent Challenged History
    let getOpponentHistory = await prisma.ghostBattleRecord.findMany({
        where: {
            carId: carId
        },
        orderBy:{
            playedAt: 'desc'
        },
        take: 10
    })
    let opponentHistory: wmproto.v388.protobuf.Car[] = [];

    // Opponent Challenged History
    for(let i=0; i<getOpponentHistory.length; i++)
    {
        // Get the opponents car data
        let car = await prisma.car.findFirst({
            where: {
                carId: getOpponentHistory[i].opponentCarId
            },
            include:{
                lastPlayedPlace: true
            }
        });

        // Push the data
        opponentHistory.push(wmproto.v388.protobuf.Car.create({
            ...car!
        }))
    }

    return { opponentHistory }
}


// Get Revengers
export async function getRevenger(carId: number)
{
    // Get all of the revengers
    let revenger: wmproto.v388.protobuf.Car[] = [];
   
    // Find Opponent revenger
    let getrevenger = await prisma.ghostRevenger.findMany({
        where: {
            carId: carId
        },
        take: 10
    });

    // revenger available
    for(let i=0; i<getrevenger.length; i++)
    {
        // Get the opponents car data
        let carTarget = await prisma.car.findFirst({
            where:{
                carId: getrevenger[i].revengerCarId
            }
        })

        // Get the advantage distance between revenger and user
        let result = 0;
        if(getrevenger[i].result > 0)
        {
            result = -Math.abs(getrevenger[i].result);
        }
        else
        {
            result = Math.abs(getrevenger[i].result);
        }

        // Push the data
        revenger.push(wmproto.v388.protobuf.Car.create({
            ...carTarget!
        }));
    }

    return { revenger }
}
