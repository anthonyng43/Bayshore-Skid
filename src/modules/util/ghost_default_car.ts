import { Config } from "../../config";

// Import Proto
import * as wm from "../../wmmt/v388.proto";

// Global Variable
let playedPlace = wm.v388.protobuf.Place.create({ 
    placeId: Config.getConfig().placeId,
    regionId: Config.getConfig().regionId,
    shopName: Config.getConfig().shopName,
    country: Config.getConfig().country
});


// Default Car for Random Ghost
export async function RandomGhost() {
    const randomAura = (): number => {
        // First decide if we want 0 or a number from the range
        const shouldBeZero = Math.random() < 0.25;
        
        if (shouldBeZero) {
            return 0;
        } else {
            // Generate random number between 928 and 1639 (inclusive)
            return Math.floor(Math.random() * (1639 - 928 + 1)) + 928;
        }
    }

    const randomVisualModel = (): number => {
        const forbiddenNumbers = [1,2,66, 67, 68];
        let result: number;
        
        do {
            result = Math.floor(Math.random() * 85);
        } while (forbiddenNumbers.includes(result));
        
        return result;
    }

    const duSetup = (visualModel: number): boolean => {
        const carWithNoDU = [6, 7]; // r35 obviously lol
        
        return !carWithNoDU.includes(visualModel);
    }
    const selectedVisualModel = randomVisualModel();
    const canUseDU = duSetup(selectedVisualModel);

    let car = wm.v388.protobuf.Car.create({
        carId: 999999999,
        name: 'ランダム',
        regionId: Math.floor(Math.random() * 47) + 1,
        visualModel: selectedVisualModel,
        defaultColor: Math.floor(Math.random() * 5) + 1,
        customColor: canUseDU ? Math.floor(Math.random() * 20) + 1 : 0,
        wheel: Math.floor(Math.random() * 50),
        wheelColor: Math.floor(Math.random() * 5) + 1,
        aero: canUseDU ? Math.floor(Math.random() * 6) + 1 : 0,
        bonnet: canUseDU ? Math.floor(Math.random() * 5) + 1 : 0,
        wing: canUseDU ? Math.floor(Math.random() * 6) + 1 : 0,
        mirror: canUseDU ? Math.floor(Math.random() * 2) + 1 : 0,
        sticker: canUseDU ? Math.floor(Math.random() * 31) + 1 : 0,
        stickerColor: canUseDU ? Math.floor(Math.random() * 10) + 1 : 0,
        neon: canUseDU ? Math.floor(Math.random() * 10) + 1: 0,
        trunk: canUseDU ? Math.floor(Math.random() * 1) + 1 : 0,
        plate: canUseDU ? Math.floor(Math.random() * 14) + 1: 0,
        plateColor: canUseDU ? Math.floor(Math.random() * 8) + 1 : 0,
        specialSticker: canUseDU ? Math.floor(Math.random() * 5) + 1 : 0,
        specialStickerColor: canUseDU ? Math.floor(Math.random() * 10) + 1 : 0,
        tunePower: 16,
        tuneHandling: 16,
        aura: randomAura(), // using function to get random number
        title: 1,
        level: Math.floor(Math.random() * 46) + 1,
        lastPlayedAt: 1656471120,
        country: 'JPN',
        lastPlayedPlace: playedPlace
    });

    return { car };
}