import { prisma } from "../..";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";
import * as wmproto from "../../wmmt/v388.proto";

// Import Util
import * as common from "../util/common";
import * as ghost_mode_saving from "./game_util/ghost_mode_saving";


// Save ghost battle result
export async function saveGhostBattleResult(body: v388.protobuf.SaveGameResultRequest, car: any)
{
    // Declare variable for return
    let ghostModePlay: boolean = false;
    let updateNewTrail: boolean = false;
    let competitionModePlay: boolean = false;
    let crownModePlay = false;

    // If the game was not retired / timed out
    if (!(body.retired || body.timeup))
    {
        console.log('Game not retired / timed out, continuing ...')
        console.log('Saving Ghost Battle Result');
        
        // Set ghost mode play to true for saving the ghost trail later
        ghostModePlay = true;

        // Declare data
        let dataCar: any;
        let dataGhost: any;

        // Get the ghost result for the car
        let cars = body?.car;

        // Car is set
        if (cars)
        {
            // Error handling to prevent set ghost level to out of range value
            if(cars.ghostLevel)
            {
                if(cars.ghostLevel < 1)
                {
                    cars.ghostLevel = 1;
                }
                else if(cars.ghostLevel > 10)
                {
                    cars.ghostLevel = 8;
                }
            }

            if (car.rgScore >= 200)
            {
                cars.ghostLevel = 10;
            }
            else
            {
                cars.ghostLevel = 9;
            }

            // Car update data
            dataCar = {
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
                sticker: common.sanitizeInput(cars.sticker),
                stickerColor: common.sanitizeInput(cars.stickerColor),
                specialSticker: common.sanitizeInput(cars.specialSticker),
                specialStickerColor: common.sanitizeInput(cars.specialStickerColor),
                ghostLevel: common.sanitizeInput(cars.ghostLevel),
            }
        }

        // Get the ghost result for the car
        let ghostResult = body?.rgResult;

        // ghostResult is set
        if (ghostResult)
        {
            // Ghost update data
            dataGhost = {
                rgPlayCount: common.sanitizeInput(ghostResult.rgPlayCount),
                rgWinCount: common.sanitizeInput(ghostResult.rgWinCount),
                dressupLevel: common.sanitizeInput(ghostResult.dressupLevel), 
                dressupPoint: common.sanitizeInput(ghostResult.dressupPoint),
                maxiCoin: common.sanitizeInput(ghostResult.maxiCoin),
                ownedDressupParts: common.sanitizeInput(ghostResult.ownedDressupParts)
            }
        }
        
        // Update the car properties
        await prisma.car.update({
            where: {
                carId: body.carId
            },
            data: {
                ...dataCar,
                ...dataGhost
            }
        });


        // --------------GHOST BATTLE SELECTION MODE--------------
        let ghost_mode_savings: any;

        switch (body.rgResult!.selectionMethod) 
        {
            // Ghost Battle Select by Challenge (1)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_CHALLENGE:
            {
                console.log('Normal Ghost Mode Found - Japan Challenge');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                break;
            }

            // Ghost Battle Select by Level (2)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_SELECT_BY_LEVEL:
            {
                console.log('Normal Ghost Mode Found - Select by Level');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                // Update the crownModePlay value
                crownModePlay = ghost_mode_savings.crownModePlay;

                break;
            }

            // Ghost Battle Select by Revengers (3)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_SELECT_FROM_REVENGES:
            {
                console.log('Normal Ghost Mode Found - Select by Revengers');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                break;
            }

            // Ghost Battle Select from History (4)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_SELECT_FROM_HISTORY:
            {
                console.log('Normal Ghost Mode Found - Select from History');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                break;
            }

            // Ghost Battle Search by Area (5)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_SEARCH_BY_AREA:
            {
                console.log('Normal Ghost Mode Found - Search by Area');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                break;
            }

            // Ghost Battle Search by Name (6)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_SEARCH_BY_NAME:
            {
                console.log('Normal Ghost Mode Found - Search by Name');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                break;
            }

            // Ghost Battle Search by Search Code (7)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_SEARCH_BY_CODE:
            {
                console.log('Normal Ghost Mode Found - Search by Search Code');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                break;
            }

            // Ghost Battle Challenger (8)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_ACCEPT_CHALLENGER:
            {
                console.log('Normal Ghost Mode Found - Challenger');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                break;
            }

            // Ghost Battle Appointment (VS HoF Ghost) (9)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_APPOINTMENT:
            {
                console.log('Competition (OCM) Ghost Mode Found - Appointment (VS HoF Ghost)');

                // Delete all the records
                await prisma.ghostCompetitionRegisteredFromTerminal.deleteMany({
                    where:{
                        carId: Number(body.carId)
                    }
                });

                break;
            }

            // Ghost Battle Default Opponent (10)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_DEFAULT_OPPONENT:
            {
                console.log('Normal Ghost Mode Found - Default Opponent');

                // Save the ghost battle record
                ghost_mode_savings = await ghost_mode_saving.saveGhostBattleRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                break;
            }

            // Competition (OCM) Ghost Battle Mode (11)
            case wmproto.v388.protobuf.GhostSelectionMethod.GHOST_COMPETITION:
            {
                console.log('Competition (OCM) Ghost Mode Found');

                // Save the ghost Competition (OCM) battle record
                ghost_mode_savings = await ghost_mode_saving.saveCompetitionGhostRecord(body);

                // Update the updateNewTrail value
                updateNewTrail = ghost_mode_savings.updateNewTrail;

                // Competition (OCM) play
                competitionModePlay = ghost_mode_savings.competitionModePlay;
                
                break;
            }
        }
    }
    // Retiring Competition (OCM)
    else if(body.rgResult!.selectionMethod === wmproto.v388.protobuf.GhostSelectionMethod.GHOST_COMPETITION)
    {
        console.log('Competition (OCM) Ghost Mode Found but Retiring');
    }
    // Retiring Normal Ghost Battle
    else
    {
        console.log('Normal Ghost Mode Found but Retiring');

        // Get the ghost result for the car
        let ghostResult = body?.rgResult;

        // ghostResult is set
        if (ghostResult)
        {
            // Ghost update data
            let dataGhost = {
                rgPlayCount: common.sanitizeInput(ghostResult.rgPlayCount), 
            }

            // Update the car properties
            await prisma.car.update({
                where: {
                    carId: body.carId
                },
                data: {
                    ...dataGhost
                }
            });
        }
    }

    // Return the value to 'BASE_PATH/src/modules/game.ts'
    return { ghostModePlay, updateNewTrail, competitionModePlay, crownModePlay }
} 