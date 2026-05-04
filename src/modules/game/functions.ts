import { prisma } from "../..";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";
import * as wmproto from "../../wmmt/v388.proto";


// Update the Car
export async function updateCar(body: v388.protobuf.SaveGameResultRequest, car: any)
{
    // Check playet at timestamp
    let timestamps = 0;
    if(body.car?.lastPlayedAt !== undefined && body.car?.lastPlayedAt !== null)
    {
        if(body.car.lastPlayedAt !== 0)
        {
            timestamps = body.car.lastPlayedAt;
        }
        else
        {
            timestamps = Math.floor(new Date().getTime() / 1000);
        }
    }

    // Update car
    await prisma.car.update({
        where: {
            carId: body.carId,
        },
        data: {
            aura: body.car!.aura!,
            odometer: body.odometer,
            playCount: body.playCount,
            level: body.car!.level!,
            title: body.car!.title!,
            tunePower: body.car!.tunePower!,
            tuneHandling: body.car!.tuneHandling!,
            teamSticker: body.car!.teamSticker!,
            lastPlayedAt: timestamps,
        }
    })

    // Update car settings
    await prisma.carSettings.update({
        where: {
            dbId: body.carId
        },
        data: {
            view: body.setting?.view,
            transmission: body.setting?.transmission,
            bgm: body.setting?.bgm,
            meter: body.setting?.meter,
            retire: body.setting?.retire,
            volume: body.setting?.volume,
            nameplate: body.setting?.nameplate,
            nameplateColor: body.setting?.nameplateColor
        }
    });

    // Get User
    let carUser = await prisma.car.findFirst({
        where: {
            carId: body.carId
        },
        select: {
            userId: true
        }
    });

    let user = await prisma.user.findFirst({
        where: {
            id: carUser?.userId
        }
    });

    // User Available
    if (user)
    {
        // Get the order of the user's cars
        let carOrder = user?.carOrder;

        // Get the index of the selected car
        let index = carOrder.indexOf(body.carId);

        // Only splice array when item is found
        if (index > -1) 
        { 
            carOrder.splice(index, 1); // 2nd parameter means remove one item only
        }

        // Add it back to the front
        carOrder.unshift(body.carId);

        // Update the values
        await prisma.user.update({
            where: {
                id: carUser?.userId
            },
            data: {
                tutorials: body.tutorials,
                carOrder: carOrder
            }
        });
    }
}

// Get User's Time Attack Record
export async function getTimeAttackRecord(body: v388.protobuf.LoadGameHistoryRequest)
{
    // Empty list of time attack records for the player's car
    let ta_records : wmproto.v388.protobuf.LoadGameHistoryResponse.TimeAttackRecord[] = [];

    let car = await prisma.car.findFirst({
        where: {
            carId: body.carId
        }
    });

    for(let i=0; i<20; i++) // GID_TACOURSE ID
    {
        // Initialize variables
        let time = null;
        let tunePower = null;
        let tuneHandling = null;
        let wholeParticipants = null;
        let modelParticipants = null;

        // Whole rank (default: null)
        let wholeRank = null;

        // Model rank (default: null)
        let modelRank = null;

        // This code could probably be done with less DB calls in the future
        // Calculate the total rank, total participants for the record
        let wholeData = await prisma.timeAttackRecord.findMany({
            where: {
                course: i
            },
            orderBy: {
                time: 'asc'
            }
        });

        let record = await prisma.timeAttackRecord.findFirst({
            where: {
                course: i,
                carId: body.carId
            }
        });

        // Calculate the model rank, model participants for the record
        let modelData = await prisma.timeAttackRecord.findMany({
            where: {
                course: i,
                model: car?.model
            },
            orderBy: {
                time: 'asc'
            }
        });

        if (wholeData)
        {
            // Get the overall number of participants
            wholeParticipants = wholeData.length;
        }

        if (modelData)
        {
            // Get the overall number of participants (with the same car model)
            modelParticipants = modelData.length;
        }

        if (record)
        {
            time = record.time;
            tunePower = record.tunePower;
            tuneHandling = record.tuneHandling;

            wholeRank = 1;
            // Loop over all of the participants
            for(let row of wholeData)
            {
                // If the car ID does not match
                if (row.carId !== body.carId)
                {
                    // Increment whole rank
                    wholeRank++;
                }
                else // Model ID matches
                {
                    // Break the loop
                    break;
                }
            }

            modelRank = 1;
            // Loop over all of the participants
            for(let row of modelData)
            {
                // If the car ID does not match
                if (row.carId !== body.carId)
                {
                    // Increment whole rank
                    modelRank++; 
                }
                else // Model ID matches
                {
                    // Break the loop
                    break;
                }
            }
        }

        // Generate the time attack record object and add it to the list
        ta_records.push(wmproto.v388.protobuf.LoadGameHistoryResponse.TimeAttackRecord.create({
            course: i,
            time: time,
            tunePower: tunePower,
            tuneHandling: tuneHandling,
            wholeParticipants: wholeParticipants!,
            wholeRank: wholeRank,
            modelParticipants: modelParticipants!,
            modelRank: modelRank
        }));
    }

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    return { ta_records, date }
}

// Get User's Ghost Battle Record
export async function getGhostBattleRecord(body: v388.protobuf.LoadGameHistoryRequest)
{
    // Get user ghost battle mode history data
    let ghostHistoryData = await prisma.ghostBattleRecord.findMany({
        where: {
            opponentCarId: body.carId,
        },
        orderBy: {
            playedAt: 'desc'
        },
        take: 10
    });

    // Empty list of ghost battle history records for the player's car
    let ghostBattle_records: wmproto.v388.protobuf.LoadGameHistoryResponse.GhostBattleRecord[] = [];
    for(let i=0; i<ghostHistoryData.length; i++)
    {
        let ghostOpponentCar = await prisma.car.findFirst({
            where: {
                carId: ghostHistoryData![i].carId
            }
        });

        let dataOpponent: any = {
            opponentName: ghostOpponentCar!.name,
            opponentModel: ghostOpponentCar!.model,
            opponentVisualModel: ghostOpponentCar!.visualModel,
            opponentDefaultColor: ghostOpponentCar!.defaultColor,
            opponentRegionId: ghostOpponentCar!.regionId,
            result: ghostHistoryData![i].opponentResult!
        }
        
        // Push the ghost battle history data
        ghostBattle_records.push(wmproto.v388.protobuf.LoadGameHistoryResponse.GhostBattleRecord.create({
            ...dataOpponent!,
            area: ghostHistoryData![i].area,
            opponentTunePower: ghostHistoryData[i].tunePower,
            opponentTuneHandling: ghostHistoryData[i].tuneHandling,
            playedAt: ghostHistoryData![i].playedAt,
            playedShopName: ghostHistoryData![i].playedShopName
        }));
    }

    return { ghostBattle_records }
}
