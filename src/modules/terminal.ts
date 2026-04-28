import { Application } from "express";
import { Config } from "../config";
import { Module } from "module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/v388.proto";

// Import Util
import * as common from "./util/common";
import * as terminal_ocm from "./terminal/terminal_ocm";
import * as startupFunctions from "./startup/functions";

export default class TerminalModule extends Module
{
	register(app: Application): void
	{
        // Load user data when entering the game or after tapping the bannapass card
        app.post('/method/load_team_information', async (req, res) => 
        {
            // Get the request body for the load user request
            let body = wm.v388.protobuf.LoadTeamInformationRequest.decode(req.body);

            // Try Catch
			try 
			{
                // Get the user from the database
				let user = await prisma.user.findFirst({
                    where: {
                        id: body.userId
                    }
                });

                // Get user team
                let team;
                let numOfMembers = 0;
                let numOfMemberCars = 0;
                let getTeam = await prisma.team.findFirst({
                    where: {
                        teamId: user?.teamId!
                    }
                });

                let homePlace = wm.v388.protobuf.Place.create({ 
                    placeId: Config.getConfig().placeId,
                    regionId: Config.getConfig().regionId,
                    shopName: Config.getConfig().shopName,
                    country: Config.getConfig().country
                });

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
                    let memberCar = await prisma.car.count({
                        where: {
                            userId: user.id
                        }
                    });

                    numOfMembers = numOfMembers + 1;
                    numOfMemberCars = numOfMemberCars + memberCar;
                }

                let leaderCar = await prisma.car.findFirst({
                    where: {
                        userId: user?.id
                    },
                    orderBy: {
                        lastPlayedAt: 'desc'
                    }
                });

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

                // Team application
                let applying = false;
                let findTeamApplication = await prisma.teamApplicant.count({
                    where: {
                        applicantUserId: body.userId
                    }
                });
                if (findTeamApplication > 0) { applying = true; }

                let applicants : wm.v388.protobuf.TeamApplicant[] = [];
                let findApplicants = await prisma.teamApplicant.findMany({
                    where: {
                        teamId: user?.teamId!
                    },
                    orderBy: {
                        expiresAt: 'asc'
                    }
                });

                for (let user of findApplicants) {
                    let car = await prisma.car.findFirst({
                        where: {
                            userId: user.applicantUserId
                        },
                        orderBy: {
                            lastPlayedAt: 'desc'
                        }
                    });

                    let numOfOwnedCars = await prisma.car.count({
                        where: {
                            userId: user.applicantUserId
                        }
                    });

                    applicants!.push(wm.v388.protobuf.TeamApplicant.create({
                        userId: user.applicantUserId,
                        car: car!,
                        numOfOwnedCars: numOfOwnedCars,
                        expiresAt: user.expiresAt
                    }));
                }

                // Response Data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,

                    // Team Create At
                    teamCreatedAt: team?.createdAt,

                    // Applying
                    applying: applying,

                    // Team
                    team: team,

                    // Notice entries
                    noticeEntries: null,

                    // News entries
                    newsEntries: null,

                    // Applicants
                    applicants: applicants,

                    // Team car id
                    teamCarId: user?.carOrder[0]
                }

                // Encode the response
                let message = wm.v388.protobuf.LoadTeamInformationResponse.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Check team name when create team
        app.post('/method/check_team_name', async (req, res) => 
        {
            // Get the request body for the check team name request
            let body = wm.v388.protobuf.CheckTeamNameRequest.decode(req.body);

            // Try Catch
			try {
                let checkTeamName = await prisma.team.count({
                    where: {
                        name: body.teamName
                    }
                });

                // Response Data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS
                };

                if (checkTeamName > 0)
                {
                    msg.error = wm.v388.protobuf.ErrorCode.ERR_NAME_CONFLICTED
                }

                // Encode the response
                let message = wm.v388.protobuf.CheckTeamNameResponse.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Create team
        app.post('/method/create_team', async (req, res) => 
        {
            // Get the request body for the create team name request
            let body = wm.v388.protobuf.CreateTeamRequest.decode(req.body);

            try {
                let team = await prisma.team.create({
                    data: {
                        name: body.teamName,
                        numOfStickers: 0,
                        leaderUserId: body.userId,
                        stickerFont: 1,
                        closed: false,
                        createdAt: body.timestamp,
                        updatedAt: body.timestamp,
                        dissolved: false,
                        fullfilled: false,
                        recruitmentSuspended: false
                    }
                });

                await prisma.user.update({
                    where: {
                        id: body.userId
                    },
                    data: {
                        teamId: team.teamId
                    }
                });

                await prisma.car.updateMany({
                    where: {
                        userId: body.userId
                    },
                    data: {
                        teamId: team.teamId,
                        teamName: body.teamName,
                        stickerFont: 1
                    }
                });

                // Encode the response
                let message = wm.v388.protobuf.DissolveTeamResponse.encode({
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS
                });

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Load team members
        app.post('/method/load_team_members', async (req, res) => 
        {
            // Get the request body for the load team members request
            let body = wm.v388.protobuf.LoadTeamMembersRequest.decode(req.body);

            try {
                // Get team id
                let team;
                let numOfMembers = 0;
                let numOfMemberCars = 0;
                let getTeam = await prisma.team.findFirst({
                    where: {
                        teamId: body.teamId
                    }
                });

                let homePlace = wm.v388.protobuf.Place.create({ 
                    placeId: Config.getConfig().placeId,
                    regionId: Config.getConfig().regionId,
                    shopName: Config.getConfig().shopName,
                    country: Config.getConfig().country
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
                
                // Response Data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                    team: team,
                    members: members
                }

                // Encode the response
                let message = wm.v388.protobuf.LoadTeamMembersResponse.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Update Team
        app.post('/method/update_team', async (req, res) => 
        {
            // Get the request body for the update request
            let body = wm.v388.protobuf.UpdateTeamRequest.decode(req.body);

            try {
                // Update
                let team = await prisma.team.findFirst({
                    where: {
                        leaderUserId: body.userId
                    }
                });

                if (team)
                {
                    await prisma.team.update({
                        where: {
                            teamId: team.teamId
                        },
                        data: {
                            stickerFont: body.teamStickerFont,
                            closed: body.closed,
                            updatedAt: body.timestamp
                        }
                    });

                    await prisma.car.updateMany({
                        where: {
                            teamId: team.teamId
                        },
                        data: {
                            stickerFont: body.teamStickerFont
                        }
                    });
                }

                // Encode the response
                let message = wm.v388.protobuf.DissolveTeamResponse.encode({
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS
                });

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Dissolve Team
        app.post('/method/dissolve_team', async (req, res) => 
        {
            // Get the request body for the dissolve request
            let body = wm.v388.protobuf.DissolveTeamRequest.decode(req.body);

            try {
                // Dissolve
                let team = await prisma.team.findFirst({
                    where: {
                        leaderUserId: body.userId
                    }
                });

                if (team)
                {
                    await prisma.team.updateMany({
                        where: {
                            teamId: team.teamId
                        },
                        data: {
                            dissolved: true
                        }
                    });
                }

                let teamMembers = await prisma.user.findMany({
                    where: {
                        teamId: team?.teamId
                    }
                });

                for (let member of teamMembers) {
                        await prisma.user.update({
                        where: {
                            id: member.id
                        },
                        data: {
                            teamId: 0
                        }
                    });

                    await prisma.car.updateMany({
                        where: {
                            userId: member.id
                        },
                        data: {
                            teamId: 0,
                            teamName: 'ＷＡＮＧＡＮ',
                            stickerFont: 1
                        }
                    });
                }

                // Encode the response
                let message = wm.v388.protobuf.DissolveTeamResponse.encode({
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS
                });

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Search team 
        app.post('/method/search_team', async (req, res) => 
        {
            // Get the request body for the search team request
            let body = wm.v388.protobuf.SearchTeamRequest.decode(req.body);

            try {
                // Get the teams
                let teams: wm.v388.protobuf.Team[] = [];
                let nameMatchedTeam;
                let numOfMembers = 0;
                let numOfMemberCars = 0;

                let homePlace = wm.v388.protobuf.Place.create({ 
                    placeId: Config.getConfig().placeId,
                    regionId: Config.getConfig().regionId,
                    shopName: Config.getConfig().shopName,
                    country: Config.getConfig().country
                });

                // Search that contains string from searched name
                let similarTeams = await prisma.team.findMany({
                    where: {
                        name: {
                            contains: body.name
                        }
                    }
                });

                for (let all of similarTeams)
                {
                    let leaderCar = await prisma.car.findFirst({
                        where: {
                            userId: all?.leaderUserId
                        },
                        orderBy: {
                            lastPlayedAt: 'desc'
                        }
                    });

                    let getMembers = await prisma.user.findMany({
                        where: {
                            teamId: all.teamId
                        },
                        orderBy: {
                            id: 'asc'
                        }
                    });

                    for (let user of getMembers)
                    {
                        let memberCar = await prisma.car.count({
                            where: {
                                userId: user.id
                            }
                        });

                        numOfMembers = numOfMembers + 1;
                        numOfMemberCars = numOfMemberCars + memberCar;
                    }

                    teams.push(wm.v388.protobuf.Team.create({
                        ...all!,
                        numOfMembers: numOfMembers,
                        numOfMemberCars: numOfMemberCars,
                        leaderCarName: leaderCar?.name!,
                        leaderRegionId: leaderCar?.regionId!,
                        homePlace: homePlace
                    }))
                }

                // Specific name search
                let teamNameSearch = await prisma.team.findFirst({
                    where: {
                        name: body.name
                    }
                });

                if (teamNameSearch)
                {
                    let leaderCar = await prisma.car.findFirst({
                        where: {
                            userId: teamNameSearch?.leaderUserId
                        },
                        orderBy: {
                            lastPlayedAt: 'desc'
                        }
                    });

                    let getMembers = await prisma.user.findMany({
                        where: {
                            teamId: teamNameSearch.teamId
                        },
                        orderBy: {
                            id: 'asc'
                        }
                    });

                    for (let user of getMembers)
                    {
                        let memberCar = await prisma.car.count({
                            where: {
                                userId: user.id
                            }
                        });

                        numOfMembers = numOfMembers + 1;
                        numOfMemberCars = numOfMemberCars + memberCar;
                    }

                    nameMatchedTeam = {
                        ...teamNameSearch!,
                        numOfMembers: numOfMembers,
                        numOfMemberCars: numOfMemberCars,
                        leaderCarName: leaderCar?.name!,
                        leaderRegionId: leaderCar?.regionId!,
                        homePlace: homePlace
                    }
                }
            
                // Response Data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                    teams: teams,
                    nameMatchedTeam: nameMatchedTeam
                }

                // Encode the response
                let message = wm.v388.protobuf.SearchTeamResponse.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Update team stickers
        app.post('/method/update_team_stickers', async (req, res) => 
        {
            // Get the request body for the update team stickers request
            let body = wm.v388.protobuf.UpdateTeamStickersRequest.decode(req.body);

            try {
                // Get the team
                let team = await prisma.team.findFirst({
                    where: {
                        leaderUserId: body.userId
                    }
                });

                let earnedStickers: wm.v388.protobuf.TeamSticker[] = [];
                let teamStickers : wm.v388.protobuf.TeamSticker[] = [];
                let numOfEarnedStickersBefore = 0;
                let numOfEarnedStickersAfter = 0;

                if (team)
                {
                    let listStockStickers = await prisma.teamStickers.findMany({
                        where: {
                            teamId: team.teamId
                        }
                    });

                    for (let teams of listStockStickers) {
                        let opponentTeam = await prisma.team.findFirst({
                            where: {
                                teamId: teams.opponentTeamId
                            }
                        });

                        teamStickers.push(wm.v388.protobuf.TeamSticker.create({
                            teamId: teams.opponentTeamId,
                            teamName: opponentTeam?.name,
                            count: teams.count
                        }));
                    }

                    numOfEarnedStickersBefore = team.numOfStickers;

                    let listNewStickers = await prisma.teamStickersEarned.findMany({
                        where: {
                            teamId: team.teamId,
                            earnedAt: {
                                lte: body.timestamp
                            }
                        }
                    });

                    for (let earned of listNewStickers) {
                        let opponentTeam = await prisma.team.findFirst({
                            where: {
                                teamId: earned.opponentTeamId
                            }
                        });

                        earnedStickers.push(wm.v388.protobuf.TeamSticker.create({
                            teamId: earned.opponentTeamId,
                            teamName: opponentTeam?.name,
                            count: earned.count
                        }));
                    }

                    numOfEarnedStickersAfter = numOfEarnedStickersBefore + listNewStickers.length;

                    await prisma.team.update({
                        where: {
                            teamId: team.teamId
                        },
                        data: {
                            numOfStickers: numOfEarnedStickersAfter
                        }
                    });
                }

                // Response data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                    earnedStickers: earnedStickers,
                    teamStickers: teamStickers,
                    numOfEarnedStickersBefore: numOfEarnedStickersBefore,
                    numOfEarnedStickersAfter: numOfEarnedStickersAfter,
                    numOfEarnedStickersToday: 0
                }

                // Encode the response
                let message = wm.v388.protobuf.UpdateTeamStickersResponse.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Join Team
        app.post('/method/join_team', async (req, res) => 
        {
            // Get the request body for the join team request
            let body = wm.v388.protobuf.JoinTeamRequest.decode(req.body);

            try {
                // Get the team
                let team = await prisma.team.findFirst({
                    where: {
                        teamId: body.teamId
                    }
                });

                // Get applicant status
                let getApplicant = await prisma.teamApplicant.findFirst({
                    where: {
                        teamId: body.teamId,
                        applicantUserId: body.userId
                    }
                });

                if (team && !getApplicant)
                {
                    await prisma.teamApplicant.create({
                        data: {
                            applicantUserId: body.userId,
                            teamId: body.teamId,
                            expiresAt: 30 // days instead of timestamp?
                        }
                    });
                }

                // Encode the response
                let message = wm.v388.protobuf.JoinTeamResponse.encode({
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS
                });

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Leave Team
        app.post('/method/leave_team', async (req, res) => 
        {
            // Get the request body for the leave team request
            let body = wm.v388.protobuf.LeaveTeamRequest.decode(req.body);

            try {
                // update user
                let user = await prisma.user.findFirst({
                    where: {
                        id: body.userId
                    }
                });

                if (user) {
                    await prisma.user.update({
                        where: {
                            id: body.userId
                        },
                        data: {
                            teamId: 0
                        }
                    });
                    
                    await prisma.car.updateMany({
                        where: {
                            userId: body.userId
                        },
                        data: {
                            teamId: 0,
                            teamName: 'ＷＡＮＧＡＮ',
                            stickerFont: 1
                        }
                    });
                }

                // Encode the response
                let message = wm.v388.protobuf.LeaveTeamResponse.encode({
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS
                });

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Load Team Applicants
        app.post('/method/load_team_applicants', async (req, res) => 
        {
            // Get the request body for the load team applicant request
            let body = wm.v388.protobuf.LoadTeamApplicantsRequest.decode(req.body);

            try {
                // Get the applicants
                let applicants : wm.v388.protobuf.TeamApplicant[] = [];

                let findApplicants = await prisma.teamApplicant.findMany({
                    where: {
                        teamId: body.teamId
                    },
                    orderBy: {
                        expiresAt: 'asc'
                    }
                });

                for (let user of findApplicants) {
                    let car = await prisma.car.findFirst({
                        where: {
                            userId: user.applicantUserId
                        },
                        orderBy: {
                            lastPlayedAt: 'desc'
                        }
                    });

                    let numOfOwnedCars = await prisma.car.count({
                        where: {
                            userId: user.applicantUserId
                        }
                    });

                    applicants!.push(wm.v388.protobuf.TeamApplicant.create({
                        userId: user.applicantUserId,
                        car: car!,
                        numOfOwnedCars: numOfOwnedCars,
                        expiresAt: user.expiresAt
                    }));
                }

                // Encode the response
                let message = wm.v388.protobuf.LoadTeamApplicantsResponse.encode({
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                    applicants: applicants
                });

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

        // Approve team applicants
        app.post('/method/approve_team_applicants', async (req, res) => 
        {
            // Get the request body for the approve team applicant request
            let body = wm.v388.protobuf.ApproveTeamApplicantsRequest.decode(req.body);

            try {
                let team = await prisma.team.findFirst({
                    where: {
                        leaderUserId: body.userId
                    }
                });

                let numOfMembers = 0;
                let numOfMemberCars = 0;
                let numOfApplicants = 0;

                if (team)
                {
                    for (let approvedUser of body.approvedUsers) {
                        await prisma.user.update({
                            where: {
                                id: approvedUser
                            },
                            data: {
                                teamId: team.teamId
                            }
                        })

                        await prisma.car.updateMany({
                            where: {
                                userId: approvedUser
                            },
                            data: {
                                teamId: team.teamId,
                                teamName: team.name,
                                stickerFont: team.stickerFont
                            }
                        });

                        let application = await prisma.teamApplicant.findFirst({
                            where: {
                                teamId: team.teamId,
                                applicantUserId: approvedUser
                            }
                        });

                        if (application) {
                            await prisma.teamApplicant.delete({
                                where: {
                                    dbId: application.dbId
                                }
                            });
                        }
                    }

                    for (let rejectedUser of body.rejectedUsers) {
                        let application = await prisma.teamApplicant.findFirst({
                            where: {
                                teamId: team.teamId,
                                applicantUserId: rejectedUser
                            }
                        });

                        if (application) {
                            await prisma.teamApplicant.delete({
                                where: {
                                    dbId: application.dbId
                                }
                            });
                        }
                    }

                    numOfApplicants = await prisma.teamApplicant.count({
                        where: {
                            teamId: team.teamId
                        }
                    });

                    // Get updated members and cars
                    let getMembers = await prisma.user.findMany({
                        where: {
                            teamId: team.teamId
                        },
                        orderBy: {
                            id: 'asc'
                        }
                    });

                    for (let user of getMembers)
                    {
                        let memberCar = await prisma.car.count({
                            where: {
                                userId: user.id
                            }
                        });

                        numOfMembers = numOfMembers + 1;
                        numOfMemberCars = numOfMemberCars + memberCar;
                    }
                }

                // Response Data
                let msg = {
                    error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
                    numOfMembers: numOfMembers,
                    numOfMemberCars: numOfMemberCars,
                    numOfApplicants: numOfApplicants
                }

                // Encode the response
                let message = wm.v388.protobuf.ApproveTeamApplicantsResponse.encode(msg);

                // Send the response to the client
                await common.sendResponse(message, res, req.rawHeaders);
            }
            catch(e)
			{
				res.sendStatus(500);
			}
        })

		// Save upon timeout / exit terminal
		app.post('/method/save_terminal_result', async (req, res) =>
		{
			// Get the contents from the request
			let body = wm.v388.protobuf.SaveTerminalResultRequest.decode(req.body);

			// Try Catch
			try
			{
				// user id is required field
				await prisma.user.update({
					where: {
						id: body.userId
					},
					data: {
						tutorials: body.tutorials,
						carOrder: body.carOrder
					}
				})

				// Encode the response
				let message = wm.v388.protobuf.SaveTerminalResultResponse.encode({
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS
                });

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		})
		
		// Terminal Competition (OCM) Ranking
		app.post('/method/load_ghost_competition_ranking', async (req, res) =>
		{
			// Get the information from the request
			let body = wm.v388.protobuf.LoadGhostCompetitionRankingRequest.decode(req.body);

			// Try Catch
			try
			{
				// Get the current date/time (unix epoch)
				let date = Math.floor(new Date().getTime() / 1000);

				// Get the Competition (OCM) Event
				let getCompetitionSchedule = await startupFunctions.competitionSchedule(null, body.competitionId);
				let ghostCompetitionSchedule = getCompetitionSchedule.competitionSchedule;

				// Other variable
				let msg: any;

				// Competition (OCM) is available
				if(ghostCompetitionSchedule)
				{
					// Get Participant
					let numOfParticipants: number = 0; // Number OCM participants
					let periodId: number = 0; // Current period id
					let ownRecords; // User own OCM record
					let topRecords: wm.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry[] = []; // All user OCM record
					let getRanking; // Get ocm ranking data

					// Current date is OCM main draw
					if(ghostCompetitionSchedule.competitionStartAt < date && ghostCompetitionSchedule.competitionCloseAt > date)
					{
						console.log('Current Competition (OCM) Day: Main Draw');

						// Get Main Draw Ranking
						getRanking = await terminal_ocm.getMainDrawRanking(body, ghostCompetitionSchedule, date);
					}
					// Current date is OCM qualifying day
					else if(ghostCompetitionSchedule.qualifyingPeriodStartAt < date && ghostCompetitionSchedule.qualifyingPeriodCloseAt > date)
					{
						console.log('Current Competition (OCM) Day: Qualifying Day');

						// Get Qualifying Day Ranking
						getRanking = await terminal_ocm.getQualifyingRanking(body, ghostCompetitionSchedule);
					}
					// Competition (OCM) has ended
					else
					{
						console.log('Current / Previous Competition (OCM) Day: OCM has Ended');

						// Get Final Ranking
						getRanking = await terminal_ocm.getFinalRanking(body, ghostCompetitionSchedule);
					}

					// Set the value
					numOfParticipants = getRanking.numOfParticipants; 
					ownRecords = getRanking.ownRecords; 
					topRecords = getRanking.topRecords; 
					periodId = getRanking.periodId; 

					// Response data
					msg = {
						error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
						periodId: periodId,
						numOfParticipants: numOfParticipants,
						competitionSchedule: ghostCompetitionSchedule,
						ownRecord: ownRecords,
						topRecords: topRecords
					}
				}
				else
				{
					// Response data
					msg = {
						error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
						numOfParticipants: 0,
					}
				}

				// Encode the response
				let message = wm.v388.protobuf.LoadGhostCompetitionRankingResponse.encode(msg);

				// Send the response to the client
				await common.sendResponse(message, res, req.rawHeaders);
			}
			catch(e)
			{
				res.sendStatus(500);
			}
		})
			
		// Register Opponent Ghost (Competition (OCM) Target Ghost)
		app.post('/method/register_opponent_ghost', async (req, res) =>
		{
			// Get the information from the request
			let body = wm.v388.protobuf.RegisterOpponentGhostRequest.decode(req.body);
			
			// Try Catch
			try
			{
				// Check if target is already registered
				let checkOpponent = await prisma.ghostCompetitionRegisteredFromTerminal.findFirst({
					where:{
						carId: body.carId,
					}
				});

				// Get Target Car ID
				let ghostCompetitionTarget = await prisma.ghostCompetitionTarget.findFirst({
					where:{
						competitionDbId: body.specialGhostId,
					},
					orderBy:{
						periodId: 'desc'
					}
				});

				// Target not yet registerted
				if(!checkOpponent)
				{
					await prisma.ghostCompetitionRegisteredFromTerminal.create({
						data:{
							carId: body.carId,
							competitionDbId: body.specialGhostId,
							opponentCarId: ghostCompetitionTarget!.carId
						}
					});
				}
				else
				{
					await prisma.ghostCompetitionRegisteredFromTerminal.update({
						where:{
							dbId: checkOpponent.dbId
						},
						data:{
							carId: body.carId,
							competitionDbId: body.specialGhostId,
							opponentCarId: ghostCompetitionTarget!.carId
						}
					});
				}

				// Response data
				let msg = {
					error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
				}

				// Encode the response
				let message = wm.v388.protobuf.RegisterOpponentGhostResponse.encode(msg);

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