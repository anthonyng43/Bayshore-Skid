import fs from 'fs';


export interface ConfigFile {
    placeId: string;
    shopName: string;
    shopNickname: string;
    regionId: number;
    country: string;
    region: string;
    regionName: string;
    serverIp?: string;
    gameOptions: GameOptions;
    unix?: UnixOptions;
    notices?: string[];
    sentryDsn?: string;
}

export interface UnixOptions {
    setuid: number;
    setgid: number;
}

export interface GameOptions {
    // Create Cars Fully Tuned
    createCarsFullyTuned: boolean;
    
    // Give meter reward every n*60 play
    giveMeterReward: number; // 1 is on, 0 is off
    
    // if the new card is not in the User databese
    // set this option to 1 will not create a new card
    // and prevent new card registration
    newCardsBanned: number; // 1 is on, 0 is off

    // revision check
    // set this option to 1 will block not matched revision
    // and from connecting to the server
    revisionCheck: number; // 1 is on, 0 is off

    // multi user instance
    // set this option to true to enable multi user instance
    multiLoggonEnabled: boolean; // true is on, false is off
}

export class Config
{
    static
        // of times the player can scratch daily.
        token // of times the player can scratch daily.
        (token: any) {
            throw new Error('Method not implemented.');
    }
    static prefix(prefix: any) {
        throw new Error('Method not implemented.');
    }
    private static cfg: ConfigFile;

    static load() 
    {
        console.log('Loading config file...');
        let cfgPath = process.env['BAYSHORE_CONFIG_PATH'];
        if (!cfgPath)
            cfgPath = './config.json';
        let cfg = fs.readFileSync(cfgPath, 'utf-8');
        let json = JSON.parse(cfg);
        this.cfg = json as ConfigFile;
    }

    static getConfig(): ConfigFile
    {
        if (!this.cfg)
            this.load();
        
        return this.cfg;
    }
}
