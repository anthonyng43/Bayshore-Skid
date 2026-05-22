import { Application } from "express";
import { Config } from "../config";
import { Module } from "module";
import { prisma } from "..";
import path from 'path';


// Import Proto
import * as wm from "../wmmt/v388.proto";
import * as wmsrv from "../wmmt/service.proto";

// Import Util
import * as common from "./util/common";
import * as crown_list from "./resource/crown_list";
import * as ranking from "./resource/ranking";
import * as ghost_trail from "./ghost/ghost_trail";
import * as event_schedule from "./startup/functions";
import * as ghost_default_car from "./util/ghost_default_car";

export default class ResourceModule extends Module
{
    register(app: Application): void
    {
        // Place List
        app.get('/resource/place_list', async (req, res) =>
        {
            // Try Catch
            try
            {
                // Empty list of place records
                let places: wm.v388.protobuf.Place[] = [];

                // Region ID must not 0
                let regionId = common.sanitizeInputNotZero(Number(Config.getConfig().regionId)) || 1;

                // Response data
                places.push(new wm.v388.protobuf.Place({
                    placeId: Config.getConfig().placeId || 'JPN0123',
                    regionId: regionId,
                    shopName: Config.getConfig().shopName || 'Bayshore',
                    country: Config.getConfig().country || 'JPN'
                }));

                let checkPlaceList = await prisma.placeList.findFirst({
                    where:{
                        placeId: Config.getConfig().placeId,
                    }
                })

                if(!checkPlaceList)
                {
                    console.log('Creating new Place List entry')

                    await prisma.placeList.create({
                        data:{
                            placeId: Config.getConfig().placeId || 'JPN0123',
                            regionId: regionId,
                            shopName: Config.getConfig().shopName || 'Bayshore',
                            country: Config.getConfig().country || 'JPN'
                        }
                    })
                }
                else
                {
                    if(checkPlaceList.shopName !== Config.getConfig().shopName)
                    {
                        await prisma.placeList.update({
                            where:{
                                id: checkPlaceList.id
                            },
                            data:{
                                regionId: regionId,
                                shopName: Config.getConfig().shopName,
                                country: Config.getConfig().country
                            }
                        })
                    }
                }

                // Encode the response
                let message = wm.v388.protobuf.PlaceList.encode({places});

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Get Ranking data for attract screen (TA, Ghost, VS)
        app.get('/resource/ranking', async (req, res) =>
        {
            // Try Catch
            try
            {
                // Empty list of all ranking records (Combination of TA, VS Stars, and Ghost Battle Win)
                let lists: wmsrv.v388.protobuf.Ranking.List[] = [];

                // Get TA Ranking
                let rankingTA = await ranking.getTimeAttackRanking();
                lists.push( ...rankingTA.lists );

                // Get VS Outrun Ranking
                let rankingVSOutrun = await ranking.getVSOutrunRanking();
                lists.push( ...rankingVSOutrun.lists );
                
                // Get Ghost Trophies Ranking
                let rankingGhostTrophies = await ranking.getGhostTrophiesRanking();
                lists.push( ...rankingGhostTrophies.lists );
                
                // Encode the response
                let message = wmsrv.v388.protobuf.Ranking.encode({lists});

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Crown List for attract screen and Crown Ghost Battle mode
        app.get('/resource/crown_list', async (req, res) =>
        {
            // Try Catch
            try
            {
                // Empty list of crown records
                let crowns: wmsrv.v388.protobuf.Crown[] = []; 

                // Get Crown List
                let crown_lists = await crown_list.getCrownList();
                crowns.push( ...crown_lists.list_crown );
                
                // Response data
                let msg = {
                    crowns: crowns
                };

                // Encode the response
                let message = wmsrv.v388.protobuf.CrownList.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
        })

        // For File List
        app.get('/static/:filename', async function (req, res)
        {
            // Try Catch
            try
            {
                // Static Files
                let paths = await prisma.fileList.findFirst({
                    where:{
                        urlFileName: req.params.filename
                    },
                    select: {
                        filePath: true
                    }
                });

                res.sendFile(path.resolve(paths!.filePath, req.params.filename), { cacheControl: false });
            }
            catch(e)
            {
                res.sendStatus(500);
            }
        });
        
        // File List
        app.get('/resource/file_list', async (req, res) =>
        {

            // Try Catch
            try
            {
                // Get the current date/time (unix epoch)
                let date = Math.floor(new Date().getTime() / 1000);

                // Empty file list
                let files: wm.v388.protobuf.FileList.FileInfo[] = [];

                // Get the file list
                let fileList = await prisma.fileList.findMany({
                    where: {
                        // notBefore is less than current date
                        notBefore: { lte: Number(date) },
            
                        // notAfter is greater than current date
                        notAfter: { gte: Number(date) },
                    },
                    orderBy:{
                        fileId: 'asc'
                    }
                });

                // FILE_PROMOTION_ANNOUNCEMENT = 1 (attract screen for both drive and terminal unit)
                // FILE_FEATURE_ANNOUNCEMENT = 4 (terminal unit after tapping the banapass)
                // FILE_SPAPP_ANNOUNCEMENT = 6 (something² wangan navi like game over screen)
                // FILE_TRIAL_ANNOUNCEMENT = 7 (idk)
                // each file type can only contain 1 file
                // if have more than 1, will only read the lastest one
                for(let i=0; i<fileList.length; i++)
                {
                    files.push(wm.v388.protobuf.FileList.FileInfo.create({
                        fileId: fileList[i].fileId,
                        fileType: fileList[i].fileType,
                        fileSize: fileList[i].fileSize,
                        url: 'https://'+Config.getConfig().serverIp+':9002/static/' +fileList[i].urlFileName,
                        sha1sum: Buffer.from(fileList[i].sha1sum, "hex"),
                        notBefore: fileList[i].notBefore,
                        notAfter: fileList[i].notAfter,
                    }));
                }

                // Response data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                    files: files,
                    interval: 5 // interval for each images if the file have more than 1 image
                }

                // Encode the response
                let message = wm.v388.protobuf.FileList.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Ghost List
        app.get('/resource/ghost_list', async (req, res) =>
        {

            // Get the url query parameter
            let car_id = Number(req.query.car_id) || undefined;

            // Try Catch
            try
            {
                // Empty list of Ghost Car
                let ghosts: wm.v388.protobuf.GhostCar[] = []; 

                let car = await prisma.car.findFirst({
                    where:{
                        carId: car_id
                    },
                    include:{
                        lastPlayedPlace: true
                    }
                });

                if(car)
                {
                    // Push the car data
                    ghosts.push(wm.v388.protobuf.GhostCar.create({  
                        car: car,
                        //nonhuman: false
                    }));
                }

                // Response data
                let msg = {
                    ghosts: ghosts
                };

                // Encode the response
                let message = wmsrv.v388.protobuf.GhostList.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Load Crown Ghost Trail or Competition (OCM) Ghost Trail
        app.get('/resource/ghost_trail', async (req, res) =>
        {
            // Get the url query parameter [For Crown Ghost Battle]
			let car_id = Number(req.query.car_id);
			let area = Number(req.query.area);

            // Get the url query parameter [For OCM Ghost Battle]
			let trail_id = Number(req.query.trail_id) || undefined;

            // Try Catch
            try
            {
                // Declare variable
                let ramp: number = 0;
                let playedAt: number = 0;
                let ghostTrail;
                let ghost_trails;

                // Query parameter from Competiiton (OCM) Ghost Battle available
                if(trail_id)
                {
                    // Get the current date/time (unix epoch)
                    let date = Math.floor(new Date().getTime() / 1000);
                    
                    // Check what is currently held event (Competition or Koshien)
                    let getCompetitionSchedule = await event_schedule.competitionSchedule(date, null);
                    let competitionSchedule = getCompetitionSchedule.competitionSchedule;

                    // Event from Competition (OCM) available
                    if(competitionSchedule)
                    {
                        console.log('Getting Ghost Trail for Competition (OCM)');

                        ghost_trails = await ghost_trail.getCompetitionGhostTrail(car_id, trail_id);
                    }

                    area = ghost_trails!.area;
                }
                // Query parameter from Crown Ghost Battle available
                else
                {
                    // Get the crown trail data
                    ghost_trails = await ghost_trail.getTrail(car_id, area);
                }

                ramp = ghost_trails!.ramp;
                playedAt = ghost_trails!.playedAt;
                ghostTrail = ghost_trails!.ghostTrail!;

                let playedPlace = wm.v388.protobuf.Place.create({ 
                    placeId: Config.getConfig().placeId,
                    regionId: Config.getConfig().regionId,
                    shopName: Config.getConfig().shopName,
                    country: Config.getConfig().country
                });

                // Response data
                let msg = {
                    carId: car_id,
                    area: area,
                    ramp: ramp,
                    playedAt: playedAt,
                    playedPlace: playedPlace,
                    trail: ghostTrail
                };
                
                // Encode the response
                let message = wm.v388.protobuf.GhostTrail.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
		})
        
        // Car Summary Request (for bookmarks, also for search ghost by name)
        app.get('/resource/car_summary', async (req, res) =>
        {
			// Get the query from the request
			let query = req.query;

			// Try Catch
			try
			{
                let cars;

				// Check the query limit
				let queryLimit = 10
				if(query.limit! > String(10)) return;

				// Check the last played place id
				if(query.last_played_place_id)
				{
					let queryLastPlayedPlaceId = 1;
					let getLastPlayedPlaceId = await prisma.placeList.findFirst({
						where:{
							placeId: String(query.last_played_place_id)
						}
					})

					if(getLastPlayedPlaceId)
					{
						queryLastPlayedPlaceId = getLastPlayedPlaceId.id;
					}

					cars = await prisma.car.findMany({
						take: queryLimit, 
						where: {
							lastPlayedPlaceId: queryLastPlayedPlaceId
						},
						include:{
							lastPlayedPlace: true
						}
					});
				}
                else if (query.search_code)
                {
                    cars = await prisma.car.findMany({
						where: {
							searchCode: String(query.search_code)
						}
					});
                }
				else
				{
					// Get all of the cars matching the query
					cars = await prisma.car.findMany({
						where: {
							OR:[
								{ 
									name: { startsWith: String(query.name) }
								},
								{ 
									name: { endsWith: String(query.name) }
								}
							]
						}
					});
				}
				
				// Response data
				let msg = {
					hitCount: cars.length,
					cars: cars
				}

				// Encode the response
				let message = wm.v388.protobuf.CarSummary.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Car Summary Request (for bookmarks, also for search ghost by name)
        app.get('/resource/car_summary_count', async (req, res) =>
        {
            // Try Catch
            try {
                let cars;

                // Get all of the cars matching the query
					cars = await prisma.car.findMany({
						where: {
							OR:[
								{ 
									name: { startsWith: String(req.query.name) }
								},
								{ 
									name: { endsWith: String(req.query.name) }
								}
							]
						},
						include:{
							lastPlayedPlace: true
						}
					});

                // Response data
				let msg = {
					hitCount: cars.length,
					cars: cars
				}

				// Encode the response
				let message = wm.v388.protobuf.CarSummary.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		})

        // Car Summary Request (for bookmarks, also for search ghost by name)
        app.get('/resource/ghost_summary', async (req, res) =>
        {
            let ghosts: wm.v388.protobuf.GhostCar[] = [];
            let ghostLevel = Number(req.query.ghost_level);
            let area = Number(req.query.area);
            let ramp = 0;
            let regionId = Number(req.query.region_id);
            let foreign = Number(req.query.foreign);
            let cars;

            let playedPlace = wm.v388.protobuf.Place.create({ 
                placeId: Config.getConfig().placeId,
                regionId: Config.getConfig().regionId,
                shopName: Config.getConfig().shopName,
                country: Config.getConfig().country
            });
            
            // Try Catch
			try
			{
                // Get tuning
                // Get default car tune
                let tunePowerDefault = 2;
                let tuneHandlingDefault = 2;
                switch (ghostLevel)
                {
                    case 1:
                        tunePowerDefault = 2
                        tuneHandlingDefault = 2
                        break;

                    case 2:
                        tunePowerDefault = 5
                        tuneHandlingDefault = 5
                        break;
                    
                    case 3:
                        tunePowerDefault = 8
                        tuneHandlingDefault = 7
                        break;
                    
                    case 4:
                        tunePowerDefault = 10
                        tuneHandlingDefault = 10
                        break;
                    
                    case 5:
                        tunePowerDefault = 13
                        tuneHandlingDefault = 12
                        break;
                    
                    case 6:
                        tunePowerDefault = 14
                        tuneHandlingDefault = 14
                        break;
                    
                    case 7:
                        tunePowerDefault = 15
                        tuneHandlingDefault = 15
                        break;
                    
                    case 8:
                        tunePowerDefault = 16
                        tuneHandlingDefault = 15
                        break;
                    
                    case 9:
                    case 10:
                        tunePowerDefault = 16
                        tuneHandlingDefault = 16
                        break;
                }

                switch (area)
                {
                    case 0:
                        // C1
                        ramp = Math.floor(Math.random() * 4);
                        break;

                    case 1:
                        // K9
                        ramp = Math.floor(Math.random() * 2) + 4;
                        break;

                    case 2:
                        // Wangan
                        ramp = Math.floor(Math.random() * 4) + 6;
                        break;

                    case 3:
                        // Yokohane
                        ramp = Math.floor(Math.random() * 4) + 10;
                        break;

                    case 4:
                        // Yaesu
                        ramp = Math.floor(Math.random() * 3) + 14;
                        break;

                    case 5:
                        // Minato Mirai
                        ramp = Math.floor(Math.random() * 4) + 17;
                        break;

                    case 6:
                        // Nagoya
                        ramp = 21
                        break;

                    case 7:
                        // Osaka
                        ramp = 22
                        break;

                    case 8:
                        // Fukuoka
                        ramp = Math.floor(Math.random() * 4) + 23;
                        break;

                    case 9:
                        // Hakone
                        ramp = Math.floor(Math.random() * 2) + 27;
                        break;
                }

                if (foreign === 0)
                {
                    for (let i = 0; i < 10; i++) {
                        cars = await prisma.car.findMany({
                            take: 5,
                            where: {
                                regionId: regionId,
                                ghostLevel: i + 1
                            }
                        });

                        switch (i + 1)
                        {
                            case 1:
                                tunePowerDefault = 2
                                tuneHandlingDefault = 2
                                break;

                            case 2:
                                tunePowerDefault = 5
                                tuneHandlingDefault = 5
                                break;
                            
                            case 3:
                                tunePowerDefault = 8
                                tuneHandlingDefault = 7
                                break;
                            
                            case 4:
                                tunePowerDefault = 10
                                tuneHandlingDefault = 10
                                break;
                            
                            case 5:
                                tunePowerDefault = 13
                                tuneHandlingDefault = 12
                                break;
                            
                            case 6:
                                tunePowerDefault = 14
                                tuneHandlingDefault = 14
                                break;
                            
                            case 7:
                                tunePowerDefault = 15
                                tuneHandlingDefault = 15
                                break;
                            
                            case 8:
                                tunePowerDefault = 16
                                tuneHandlingDefault = 15
                                break;
                            
                            case 9:
                            case 10:
                                tunePowerDefault = 16
                                tuneHandlingDefault = 16
                                break;
                        }

                        if (cars.length <= 5) {
                            let ghost_default_cars = await ghost_default_car.RandomGhost();

                            // Create Ghost
                            ghosts.push(wm.v388.protobuf.GhostCar.create({
                                car: {
                                    ...ghost_default_cars.car,
                                    regionId: regionId,
                                    carId: 999999999 - i, // prevent dupilcate id
                                    tuneHandling: tuneHandlingDefault,
                                    tunePower: tunePowerDefault,
                                    lastPlayedAt: Math.floor(new Date().getTime() / 1000),
                                    lastPlayedPlace: playedPlace,
                                    ghostLevel: i + 1,
                                },
                                area: Math.floor(Math.random() * 10),
                                nonhuman: true
                            }));
                        }
                        else
                        {
                            let ghost = await prisma.ghostTrail.findFirst({
                                where: {
                                    carId: cars[0]?.carId,
                                    crownBattle: false
                                }
                            });

                            if (ghost) {
                                // Create Ghost
                                ghosts.push(wm.v388.protobuf.GhostCar.create({
                                    car: {
                                        ...cars[0],
                                        tuneHandling: ghost.tuneHandling,
                                        tunePower: ghost.tunePower,
                                        lastPlayedAt: ghost.playedAt,
                                        lastPlayedPlace: playedPlace
                                    },
                                    area: ghost.area,
                                    ramp: ghost.ramp,
                                    nonhuman: false,
                                    ghostLevel: cars[0].ghostLevel
                                }));
                            }
                            else
                            {
                                // Create Ghost
                                ghosts.push(wm.v388.protobuf.GhostCar.create({
                                    car: {
                                        ...cars[0],
                                        lastPlayedAt: Math.floor(new Date().getTime() / 1000),
                                        lastPlayedPlace: playedPlace
                                    },
                                    area: Math.floor(Math.random() * 10),
                                    nonhuman: true,
                                    ghostLevel: i + 1
                                }));
                            }
                        }
                    }
                }
                else
                {
                    if (ghostLevel)
                    {
                        cars = await prisma.car.findMany({
                            take: 10,
                            where: {
                                ghostLevel: ghostLevel
                            }
                        });
                    }

                    if (regionId)
                    {
                        cars = await prisma.car.findMany({
                            take: 10,
                            where: {
                                regionId: regionId
                            }
                        });
                    }
                    
                    if (cars!.length === 10 ) {
                        for(let car of cars!)
                        {
                            let ghost = await prisma.ghostTrail.findFirst({
                                where: {
                                    carId: car.carId
                                }
                            });

                            if (ghost) {
                                // Create Ghost
                                ghosts.push(wm.v388.protobuf.GhostCar.create({
                                    car: {
                                        ...car,
                                        tuneHandling: ghost.tuneHandling,
                                        tunePower: ghost.tunePower,
                                        lastPlayedAt: ghost.playedAt,
                                        lastPlayedPlace: playedPlace
                                    },
                                    area: ghost.area,
                                    ramp: ghost.ramp
                                }));
                            } else {
                                // Create Ghost
                                ghosts.push(wm.v388.protobuf.GhostCar.create({
                                    car: {
                                        ...car,
                                        tuneHandling: tuneHandlingDefault,
                                        tunePower: tunePowerDefault,
                                        lastPlayedAt: Math.floor(new Date().getTime() / 1000),
                                        lastPlayedPlace: playedPlace
                                    },
                                    area: area,
                                    ramp: ramp
                                }));
                            }
                        }
                    }
                    else
                    {
                        for(let car of cars!)
                        {
                            let ghost = await prisma.ghostTrail.findFirst({
                                where: {
                                    carId: car.carId
                                }
                            });

                            if (ghost) {
                                // Create Ghost
                                ghosts.push(wm.v388.protobuf.GhostCar.create({
                                    car: {
                                        ...car,
                                        tuneHandling: ghost.tuneHandling,
                                        tunePower: ghost.tunePower,
                                        lastPlayedAt: ghost.playedAt,
                                        lastPlayedPlace: playedPlace
                                    },
                                    area: ghost.area,
                                    ramp: ghost.ramp
                                }));
                            } else {
                                // Create Ghost
                                ghosts.push(wm.v388.protobuf.GhostCar.create({
                                    car: {
                                        ...car,
                                        tuneHandling: tuneHandlingDefault,
                                        tunePower: tunePowerDefault,
                                        lastPlayedAt: Math.floor(new Date().getTime() / 1000),
                                        lastPlayedPlace: playedPlace
                                    },
                                    area: area,
                                    ramp: ramp,
                                }));
                            }
                        }

                        for (let i = cars!.length; i < 10; i++) {
                            let ghost_default_cars = await ghost_default_car.RandomGhost();

                            // Create Ghost
                            ghosts.push(wm.v388.protobuf.GhostCar.create({
                                car: {
                                    ...ghost_default_cars.car,
                                    carId: 999999999 - i, // prevent dupilcate id
                                    tuneHandling: tuneHandlingDefault,
                                    tunePower: tunePowerDefault,
                                    lastPlayedAt: Math.floor(new Date().getTime() / 1000),
                                    lastPlayedPlace: playedPlace,
                                    ghostLevel: ghostLevel
                                },
                                area: area,
                                ramp: ramp
                            }));
                        }
                    }
                }

                // Response data
				let msg = {
                    ghosts
				}

				// Encode the response
				let message = wm.v388.protobuf.GhostSummary.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Car Summary Request (for bookmarks, also for search ghost by name)
        app.get('/resource/active_team_list', async (req, res) =>
        {
            // Get the current date/time (unix epoch)
            let date = Math.floor(new Date().getTime() / 1000);
            let numOfMembers = 0;
            let numOfMemberCars = 0;
            let homePlace = wm.v388.protobuf.Place.create({ 
                placeId: Config.getConfig().placeId,
                regionId: Config.getConfig().regionId,
                shopName: Config.getConfig().shopName,
                country: Config.getConfig().country
            });

            // Try catch
            try {
                let teams: wm.v388.protobuf.ActiveTeamList.ActiveTeam[] = [];
                let activeTeams = await prisma.team.findMany({
                    where: {
                        updatedAt: {
                            gte: date - 31556926
                        }
                    }
                });

                for (let active of activeTeams)
                {
                    let team;
                    
                    // Get team id
                    let getTeam = await prisma.team.findFirst({
                        where: {
                            teamId: active.teamId
                        }
                    });

                    let leaderCar = await prisma.car.findFirst({
                        where: {
                            userId: getTeam?.leaderUserId
                        },
                        orderBy: {
                            lastPlayedAt: 'desc'
                        }
                    });
    
                    // get members
                    let members: wm.v388.protobuf.TeamMember[] = [];
                    let getMembers = await prisma.user.findMany({
                        where: {
                            teamId: getTeam?.teamId
                        },
                        orderBy: {
                            id: 'asc'
                        }
                    });
    
                    for (let user of getMembers)
                    {
                        let memberCar = await prisma.car.findMany({
                            where: {
                                userId: user.id
                            },
                            orderBy: {
                                lastPlayedAt: 'desc'
                            }
                        });
    
                        members.push(wm.v388.protobuf.TeamMember.create({
                            userId: user.id,
                            car: memberCar[0],
                            numOfOwnedCars: memberCar.length
                        }));

                        numOfMembers = numOfMembers + 1;
                        numOfMemberCars = numOfMemberCars + memberCar.length;
                    }

                    if (getTeam)
                    {
                        team = {
                            ...getTeam!,
                            numOfMembers: numOfMembers,
                            numOfMemberCars: numOfMemberCars,
                            leaderCarName: leaderCar?.name!,
                            leaderRegionId: leaderCar?.regionId!,
                            homePlace: homePlace
                        };
                    }

                    teams.push(wm.v388.protobuf.ActiveTeamList.ActiveTeam.create({
                        team: team!,
                        members: members,
                        numOfStickers: active.numOfStickers,
                        updatedAt: active.updatedAt
                    }))
                }

                // Response data
				let msg = {
                    teams
				}

                // Encode the response
                let message = wmsrv.v388.protobuf.ActiveTeamList.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
			catch(e)
			{
				res.sendStatus(500);
			}
		})
    }
}