import { prisma } from "../..";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";


// Save game result
export async function giveMeterRewards(body: v388.protobuf.SaveGameResultRequest)
{
    // Get car's available meter data
    let car = await prisma.car.findFirst({ 
        where: {
            carId: body.carId
        }
    });
    
    switch (car?.playCount)
    {
        case 60:
            car.ownedMeters = 1; // Namco Meter
            break;

        case 120:
            car.ownedMeters = 9; // Special Meter
            break;

        case 180:
            car.ownedMeters = 11; // Story Yellow Meter
            break;

        case 240:
            car.ownedMeters = 15; // Story Red Meter
            break;

        default:
            break; // Break this switch
    }

    await prisma.car.update({
        where: {
            carId: body.carId
        },
        data: {
            ownedMeters: car?.ownedMeters
        }
    })
}