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


// Default Car for Random Ghost TODO: define random stickers
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
        const forbiddenNumbers = [44, 45, 46, 61, 62, 63, 64, 65, 67, 68, 69, 70, 93];
        let result: number;
        
        do {
            result = Math.floor(Math.random() * 90);
        } while (forbiddenNumbers.includes(result));
        
        return result;
    }

    const duSetup = (visualModel: number): boolean => {
        const carWithNoDU = [27, 28, 99, 116, 118, 119, 120, 122, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 139, 143, 145];
        
        return !carWithNoDU.includes(visualModel);
    }
    const selectedVisualModel = randomVisualModel();
    const carWithLimitedDU = [114, 115, 123, 124, 125, 126];
    const hasLimitedDU = carWithLimitedDU.includes(selectedVisualModel);
    const canUseDU = duSetup(selectedVisualModel);

    let car = wm.v388.protobuf.Car.create({
        carId: 999999999,
        name: 'ランダム',
        regionId: Math.floor(Math.random() * 47) + 1,
        visualModel: selectedVisualModel,
        defaultColor: Math.floor(Math.random() * 5),
        customColor: canUseDU ? Math.floor(Math.random() * 25) : 0,
        wheel: Math.floor(Math.random() * 50),
        wheelColor: Math.floor(Math.random() * 5),
        aero: canUseDU ? Math.floor(Math.random() * 5) : 0,
        bonnet: canUseDU ? Math.floor(Math.random() * 5) : 0,
        wing: canUseDU ? Math.floor(Math.random() * 5) : 0,
        mirror: canUseDU ? Math.floor(Math.random() * 2) : 0,
        sticker: 0,
        stickerColor: 0,
        neon: canUseDU && !hasLimitedDU ? Math.floor(Math.random() * 10) : 0,
        trunk: canUseDU && !hasLimitedDU ? Math.floor(Math.random() * 1) : 0,
        plate: canUseDU ? Math.floor(Math.random() * 4) : 0,
        plateColor: canUseDU ? Math.floor(Math.random() * 10) : 0,
        specialSticker: 0,
        specialStickerColor: 0,
        tunePower: 16,
        tuneHandling: 16,
        aura: randomAura(), // using function to get random number
        title: 1,
        level: Math.floor(Math.random() * 56),
        lastPlayedAt: 1656471120,
        country: 'JPN',
        lastPlayedPlace: playedPlace
    });

    return { car };
}