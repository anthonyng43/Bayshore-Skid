import { prisma } from "../..";
import { User } from "@prisma/client";
import Long from "long";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";
import * as wmproto from "../../wmmt/v388.proto";

// Import Util
import * as common from "../util/common";
import { Config } from "../../config";

// Get Car Data
export async function getCar(carId: number) {
    
    // Get the car (required data only) with the given id
    let car = await prisma.car.findFirst({
        where: {
            carId: carId
        },
        include: {
            setting: true,
            lastPlayedPlace: true
        }
    });

    // Error handling if car tune is more than 32 steps
    if (car!.tunePower + car!.tuneHandling > 32) {
        
        // set it to 720/B in game and update database
        car!.tunePower = 16;
        car!.tuneHandling = 16;

        await prisma.car.update({
            where: {
                carId: car!.carId
            },
            data: {
                tunePower: 16,
                tuneHandling: 16
            }
        })
    }

    // Error handling if ghostLevel accidentally set to 0 or more than 11
    if (car!.ghostLevel < 1) {
        
        car!.ghostLevel = 1;

        await prisma.car.update({
            where: {
                carId: car!.carId
            },
            data: {
                ghostLevel: 1
            }
        })
    }

    // Convert the database lose bits to a Long
    let longLoseBits = Long.fromString(car!.stLoseBits.toString());

    return { ...car!, longLoseBits }
}

// Get Opponents Target
export async function getRegisteredTarget(carId: number) {
    
    // Get Registered Target
    let getTargetCount = await prisma.ghostCompetitionRegisteredFromTerminal.count({
        where: {
            carId: carId
        }
    });
    let opponentGhost = null;
    let opponentTrailId = null;
    let opponentCompetitionId = null;
    let registeredargetAvailable = false;

    if(getTargetCount > 0) {
        
        console.log('Registered Opponents Available');

        let getTarget = await prisma.ghostCompetitionRegisteredFromTerminal.findFirst({
            where: {
                carId: carId
            }
        });

        let getTargetTrail = await prisma.ghostCompetitionTargetGhostTrail.findFirst({
            where:{
                carId: getTarget?.opponentCarId,
                competitionDbId: Number(getTarget?.competitionDbId)
            },
            orderBy:{
                periodId: 'desc'
            }
        });

        if(getTargetTrail) {
            
            let getTargetCar = await prisma.car.findFirst({
                where:{
                    carId: getTarget?.opponentCarId
                },
                include:{
                    lastPlayedPlace: true
                }
            });

            opponentGhost = wmproto.v388.protobuf.GhostCar.create({
                car: {
                    ...getTargetCar!,
                    tunePower: getTargetTrail!.tunePower,
                    tuneHandling: getTargetTrail!.tuneHandling,
                },
                area: getTargetTrail!.area,
                ramp: getTargetTrail!.ramp,
                //nonhuman: false
            });
            opponentTrailId = Number(getTargetTrail!.dbId);
            opponentCompetitionId = Number(getTarget?.competitionDbId);
        }

        registeredargetAvailable = true;
    }

    return { opponentGhost, opponentTrailId, opponentCompetitionId, registeredargetAvailable }
}

// Get Opponents Target
export async function getOpponentsTarget(carId: number, registeredargetAvailable: boolean) {
    
    let challenger = null;

    // There are no Challenge HoF Registered
    if(registeredargetAvailable === false) {
        
        // Check opponents target
        let opponentTargetCount = await prisma.ghostRevenger.count({
            where:{
                carId: carId
            }
        });

        if(opponentTargetCount > 0) {
            
            console.log('Challengers Available');

            // Randomize pick
            let random: number = 1;
            let randomArray: number[] = [];
            let maxNumber = 5;

            // Change the max number limit if less than 5
            if(opponentTargetCount < 5)
            { 
                maxNumber = opponentTargetCount;
            }

            // Randomize it 5 times
            while(randomArray.length < maxNumber) { 
                
                // Pick random car Id
                random = Math.floor(Math.random() * opponentTargetCount);

                // Try randomize it again if it's 0, and fix if more than car length
                if(random < 1 || random >= opponentTargetCount)
                {
                    random = Math.floor(Math.random() * opponentTargetCount);
                }

                // Random Number not yet selected
                if(randomArray.indexOf(random) === -1)
                {
                    // Push current number to array
                    randomArray.push(random);
                }
            }

            // Pick the array number
            let pickRandom = Math.floor(Math.random() * randomArray.length);
            random = randomArray[pickRandom];

            // Check opponents target
            let opponentTarget = await prisma.ghostRevenger.findFirst({
                where: {
                    carId: carId,
                },
                orderBy: [
                    {
                        id: 'asc'
                    }
                ],
                skip: random,
                take: 1,
            });
        
            // Challengers Available
            if(opponentTarget) {
                // Get Car Target
                let carTarget = await prisma.car.findFirst({
                    where:{
                        carId: opponentTarget.revengerCarId
                    },
                    include:{
                        lastPlayedPlace: true
                    }
                });

                // Car Target Available
                if(carTarget) {

                    // Push the data
                    challenger = wmproto.v388.protobuf.GhostCar.create({
                        car: carTarget
                    });
                }
            }
        }
    }

    return { challenger }
}

// Create Car
export async function createCar(body: v388.protobuf.CreateCarRequest) {
    
    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Retrieve user from card chip / user id
    let user: User | null;

    // User ID provided, use that
    if (body.userId) {
        
        user = await prisma.user.findFirst({
            where: {
                id: body.userId
            },
        });
    } 
    // No user id, use card chip
    else 
    { 
        user = await prisma.user.findFirst({
            where: {
                chipId: body.cardChipId,
                accessCode: body.accessCode
            },
        });
    }
    
    // User not found, terminate
    if (!user) throw new Error();

    // Generate blank car settings object
    let settings = await prisma.carSettings.create({
        data: {}
    });

    // Generate blank car state object
    let state = await prisma.carState.create({
        data: {}
    });

    // Team
    let stickerFont = 1;
    let teamId = 0;
    let teamName = 'ＷＡＮＧＡＮ';

    let team = await prisma.team.findFirst({
        where: {
            teamId: user.teamId!
        }
    });

    if (team) {
        stickerFont = team.stickerFont;
        teamId = team.teamId;
        teamName = team.name;
    }

    // 0: Stock Tune
    // 1: Basic Tune (600 HP)
    // 2: Fully Tuned (830 HP)
    let tune = 0;

    // Other cases, may occur if item is not detected as 'used'
    // User item not used, but car has 720 HP by default
    if (body.car && Config.getConfig().gameOptions.createCarsFullyTuned)
    {
        // Car is fully tuned
        tune = 2;
    }
    // User item not used, but car has 600 HP by default
    else if (body.car && body.method == v388.protobuf.CarCreationMethod.CAR_HP600)
    {
        // Car is basic tuned
        tune = 1;
    }

    // Randomize pick
    let random: number = 1;
    let randomArray: number[] = [];

    // Randomize it 5 times
    while(randomArray.length < 5)
    { 
        // Pick random car Id
        random = Math.floor(Math.random() * 47) + 1;

        // Try randomize it again if it's 0, and fix if more than car length
        if(random < 1 || random > 47)
        {
            random = Math.floor(Math.random() * 47) + 1;
        }

        // Random Number not yet selected
        if(randomArray.indexOf(random) === -1)
        {
            // Push current number to array
            randomArray.push(random);
        }
    }

    // Pick the array number
    let pickRandom = Math.floor(Math.random() * randomArray.length);
    random = randomArray[pickRandom];

    // Search Code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let exists = true;
    let searchCode = '';

    while (exists) {
        searchCode = '';

        for (let i = 0; i < 6; i++) {
            searchCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const count = await prisma.car.count({
            where: {
                searchCode: searchCode
            }
        });

        exists = count > 0;
    }

    // Default car values
    let carInsert = {
        userId: user.id,
        manufacturer: body.car.manufacturer!,
        defaultColor: body.car.defaultColor!,
        model: body.car.model!,
        visualModel: body.car.visualModel!,
        name: body.car.name!,
        title: body.car.title,
        level: body.car.level,
        tunePower: body.car.tunePower,
        tuneHandling: body.car.tuneHandling,
        customColor: body.car.customColor,
        wheel: body.car.wheel,
        wheelColor: body.car.wheelColor,
        aero: body.car.aero,
        bonnet: body.car.bonnet,
        wing: body.car.wing,
        mirror: body.car.mirror,
        neon: body.car.neon,
        trunk: body.car.trunk,
        plate: body.car.plate,
        plateColor: body.car.plateColor,
        carSettingsDbId: settings.dbId,
        carStateDbId: state.dbId,
        regionId: random,
        searchCode: searchCode,
        lastPlayedAt: date,
        lastPlayedPlaceId: 1, // Server Default
        stickerFont: stickerFont,
        teamId: teamId,
        teamName: teamName 
    };

    return { carInsert, tune, user }
}

// Get Car Tune
export async function getCarTune(tune: number, carInsert: any) {
    
    // Additional car values (for basic / full tune)
    let additionalInsert = {};

    switch(tune) {
        
        // 0: Stock, nothing extra

        case 1: // Basic Tune

            // Updated default values
            carInsert.level = 2; // C8
            carInsert.tunePower = 10; // 600 HP
            carInsert.tuneHandling = 10; // 600 HP

            // Additional basic tune values
            additionalInsert = {
                ghostLevel: 4,
                stClearBits: 0,
                stLoseBits: 0,
                stClearCount: 20,
                stClearDivCount: 1,
                stConsecutiveWins: 20,
                stConsecutiveWinsMax: 20
            };
        break;

        case 2: // Fully Tuned

            // Updated default values
            carInsert.level = 8; // C3
            carInsert.tunePower = 16; // 720 HP
            carInsert.tuneHandling = 16; // 720 HP

            // Additional full tune values
            additionalInsert = {
                ghostLevel: 8,
                stClearBits: 524287,
                stLoseBits: 0,
                stClearCount: 59,
                stClearDivCount: 2,
                stConsecutiveWins: 59,
                stConsecutiveWinsMax: 59
            };
    }

    return { additionalInsert }
}

// Car Order
export async function carOrder(carOrder: any, car: any, userId: number) {
    
    // Add the new car to the front of the id
    carOrder.unshift(car.carId);

    // Add the car to the front of the order
    await prisma.user.update({
        where: {
            id: userId
        }, 
        data: {
            carOrder: carOrder
        }
    });

    console.log(`Created new car ${car.name} with ID ${car.carId}`);
}

// Update Car
export async function updateCar(body: v388.protobuf.UpdateCarRequest) {
    
    // Get the ghost result for the car
    let cars = body?.car;

    // Declare data
    let data: any;

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Car is set
    if (cars) {
        
        // Car update data
        data = {
            customColor: common.sanitizeInput(cars.customColor),
            wheel: common.sanitizeInput(cars.wheel),
            wheelColor: common.sanitizeInput(cars.wheelColor), 
            aero: common.sanitizeInput(cars.aero),
            bonnet: common.sanitizeInput(cars.bonnet),
            wing: common.sanitizeInput(cars.wing),
            mirror: common.sanitizeInput(cars.mirror),
            neon: common.sanitizeInput(cars.neon),
            trunk: common.sanitizeInput(cars.trunk),
            plate: common.sanitizeInput(cars.plate),
            plateColor: common.sanitizeInput(cars.plateColor),
            title: common.sanitizeInput(cars.title),
            aura: common.sanitizeInput(cars.aura),
            lastPlayedAt: date
        };

        // Update the car info
        await prisma.car.update({
            where: {
                carId: body.carId
            },
            data: data
        });
    }
}

// Update Car Setting
export async function updateCarSetting(body: v388.protobuf.UpdateCarRequest) {
    // Update the car settings
    await prisma.carSettings.update({
        where: {
            dbId: body.carId,
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
}

// Prepare Car Succession
export async function W3PCheck(body: v388.protobuf.PrepareCarSuccessionRequest) {
    // CarId for successionId
    let carId = 0;

    let user = await prisma.user.findFirst({
        where: {
            id: body.userId
        }
    })

    // Generate blank car settings object
    let settings = await prisma.carSettings.create({
        data: {}
    });

    // Generate blank car state object
    let state = await prisma.carState.create({
        data: {}
    });

    // Team
    let team = await prisma.team.findFirst({
        where: {
            teamId: user?.teamId!
        }
    });

    // Randomize pick
    let random: number = 1;
    let randomArray: number[] = [];

    // Randomize it 5 times
    while(randomArray.length < 5)
    {
        // Pick random car Id
        random = Math.floor(Math.random() * 47) + 1;

        // Try randomize it again if it's 0, and fix if more than car length
        if(random < 1 || random > 47)
        {
            random = Math.floor(Math.random() * 47) + 1;
        }

        // Random Number not yet selected
        if(randomArray.indexOf(random) === -1)
        {
            // Push current number to array
            randomArray.push(random);
        }
    }

    // Pick the array number
    let pickRandom = Math.floor(Math.random() * randomArray.length);
    random = randomArray[pickRandom];

    // Search Code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let exists = true;
    let searchCode = '';

    while (exists) {
        searchCode = '';

        for (let i = 0; i < 6; i++) {
            searchCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const count = await prisma.car.count({
            where: {
                searchCode: searchCode
            }
        });

        exists = count > 0;
    }

    // transfer data handling
    let stClearBits = 0;
    let dressupLevel = 0;
    let tunePower = body.w3pTunePower;
    let tuneHandling = body.w3pTuneHandling;
    let ownedMeters = 0;
    let ownedBgm = 0;
    let earnedCustomColor = false;
    let teamId = 0;
    let teamName = 'ＷＡＮＧＡＮ';
    let stickerFont = 1;
    
    if (tunePower + tuneHandling > 32) {
        stClearBits = 16383;
        tunePower = 16;
        tuneHandling = 15;
    } else {
        tunePower = body.w3pTunePower;
        tuneHandling = body.w3pTuneHandling;
    }
    if (body.w3pDress >= 63) { dressupLevel = 63; } else { dressupLevel = body.w3pDress; }
    if (body.w3pHasMaxi2NolosePoint) { ownedMeters = 1; }
    if (body.w3pHasMaxi2NolosePoint && body.w3pHasStoryNolosePoint) { ownedMeters = 9; }
    if (body.w3pHasMaxi2NolosePoint) { ownedBgm = 8; }
    if (body.w3pHasMaxi2NolosePoint && body.w3pHasStoryNolosePoint) { ownedBgm = 12; }
    if (body.w3pRenewal > 0) { earnedCustomColor = true; }

    if (team) {
        teamId = team.teamId;
        teamName = team.name;
        stickerFont = team.stickerFont;
    }

    // Car
    let car = await prisma.car.create({
        data: {
            userId: body.userId,
            name: body.car.name!,
            manufacturer: body.car.manufacturer!,
            defaultColor: body.car.defaultColor!,
            customColor: body.car.customColor,
            model: body.car.model!,
            visualModel: body.car.visualModel!,
            title: body.car.title,
            level: body.w3pClass,
            tunePower: tunePower,
            tuneHandling: tuneHandling,
            carSettingsDbId: settings.dbId,
            carStateDbId: state.dbId,
            regionId: random,
            searchCode: searchCode,
            stClearBits: stClearBits,
            stClearCount: body.w3pStoryClearCount,
            stClearDivCount: Math.floor((body.w3pStoryClearCount / 20) / 3),
            stConsecutiveWins: body.w3pStorySuccessiveVictoryCount,
            stConsecutiveWinsMax: body.w3pStorySuccessiveVictoryCount,
            stLose: false,
            stLoseBits: 0,
            odometer: body.w3pOdoCount,
            aura: 0,
            rgWinCount: body.w3pTargetWinCount,
            rgPlayCount: body.w3pTargetPlayCount,
            maxiCoin: body.w3pMaxiCoin,
            dressupLevel: dressupLevel,
            dressupPoint: 0,
            vsStarCount: body.w3pJoinStarCount,
            vsStarCountMax: body.w3pJoinStarCount,
            vsPlayCount: body.w3pJoinPlayCount,
            lastPlayedAt: body.timestamp,
            earnedCustomColor: earnedCustomColor,
            ownedDressupParts: dressupLevel,
            ownedCustomColors: body.w3pRenewal,
            ownedMeters: ownedMeters,
            ownedBgm: ownedBgm,
            lastPlayedPlaceId: 1, // Server Default
            stickerFont: stickerFont,
            teamId: teamId,
            teamName: teamName
        }
    });

    carId = car.carId;

    console.log(`Created new car ${car.name} with ID ${car.carId} from W3P Transfer`);

    return { carId, searchCode }
}

// Succeed Car Succession
export async function WM4Transfer(body: v388.protobuf.SucceedCarRequest) {
    let carId = 0;

    let car = await prisma.car.findFirst({
        where: {
            carId: body.successionId
        }
    });

    carId = car?.carId!;
    
    return { carId }
}