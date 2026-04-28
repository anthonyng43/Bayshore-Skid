import { prisma } from "../..";

//Import Proto
import wmsrv from "../../wmmt/service.proto";

// Get Crown List
export async function getCrownList()
{
    // Empty list of crown records
    let list_crown: wmsrv.v388.protobuf.Crown[] = [];

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get the crown holder data
    let car_crown = await prisma.ghostCrown.findMany({ 
        orderBy: {
            area: 'asc'
        },
        distinct: ['area']
    });

    let defaultName = ["さきがけ","おおすみ","りゅうせい","はやぶさ","かけはし","ミライ","はごるも","まいど","あすか","はるか"];
    let defaultVisualModel = [41,23,33,51,49,0,31,11,8,20];
    let playedPlace = wmsrv.v388.protobuf.Place.create({ 
        placeId: 'JPN012',
        regionId: 1,
        shopName: 'アミパラがいな',
        country: 'JPN'
    });
    
    // Crown holder data available
    if(car_crown.length !== 0)
    {
        // Loop GID_RUNAREA
        for(let i=0; i<10; i++)
        {
            // Get user's data
            let car = await prisma.car.findFirst({
                where: {
                    carId: car_crown[i].carId
                },
                include: {
                    lastPlayedPlace: true
                }
            });

            // If car data is found
            if (car)
            {
                // Set the tunePower and tuneHandling used when capturing ghost crown
                car!.tunePower = car_crown[i].tunePower;
                car!.tuneHandling = car_crown[i].tuneHandling;

                // Acquired crown timestamp - 1 day (prevent locking)
                car!.lastPlayedAt = car_crown[i].playedAt - 172800;

                // Acquired crown timestamp - 1 day (prevent locking)
                car_crown[i].playedAt = car_crown[i].playedAt - 172800;

                // PlayedAt still bigger than current date (prevent locking)
                if(car_crown[i].playedAt > date)
                {
                    car_crown[i].playedAt = date;
                }
                // PlayedAt still smaller than 1674579600
                else if(car_crown[i].playedAt < 1674579600)
                {
                    car_crown[i].playedAt = 1674579600;
                }

                // Push the car data to the crown holder data
                list_crown.push(wmsrv.v388.protobuf.Crown.create({  
                    carId: car_crown[i].carId,
                    area: car_crown[i].area,
                    unlockAt: car_crown[i].playedAt,
                    car: car!
                }));
            }
            else
            {
                let car = wmsrv.v388.protobuf.Car.create({
                    carId: 999999999-i,
                    regionId: Math.floor(Math.random() * 47) + 1,
                    name: defaultName[i],
                    visualModel: defaultVisualModel[i],
                    customColor: 0,
                    wheel: 0,
                    wheelColor: 0,
                    aero: 0,
                    bonnet: 0,
                    wing: 0,
                    mirror: 0,
                    neon: 0,
                    trunk: 0,
                    sticker: 0,
                    stickerColor: 0,
                    specialSticker: 0,
                    specialStickerColor: 0,
                    tuneHandling: 0,
                    tunePower: 0,
                    plate: 0,
                    plateColor: 0,
                    title: 0,
                    level: 0
                });

                // Push the car data to the crown holder data
                list_crown.push(wmsrv.v388.protobuf.Crown.create({  
                    carId: 999999999-i,
                    area: i,
                    unlockAt: 0,
                    car: car!
                }));
            }
        }
    }
    else
    {
        // Loop GID_RUNAREA
        for(let i=0; i<10; i++)
        {
            let car = wmsrv.v388.protobuf.Car.create({
                carId: 999999999-i,
                regionId: Math.floor(Math.random() * 47) + 1,
                name: defaultName[i],
                visualModel: defaultVisualModel[i],
                customColor: 0,
                wheel: 0,
                wheelColor: 0,
                aero: 0,
                bonnet: 0,
                wing: 0,
                mirror: 0,
                neon: 0,
                trunk: 0,
                sticker: 0,
                stickerColor: 0,
                specialSticker: 0,
                specialStickerColor: 0,
                tuneHandling: 0,
                tunePower: 0,
                plate: 0,
                plateColor: 0,
                title: 0,
                level: 0,
                lastPlayedPlace: playedPlace
            });

            // Push the car data to the crown holder data
            list_crown.push(wmsrv.v388.protobuf.Crown.create({  
                carId: 999999999 - i,
                area: i,
                unlockAt: 0,
                car: car!
            }));
        }
    }

    return { list_crown }
}