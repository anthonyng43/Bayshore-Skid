import { Config } from "../../config";
import { prisma } from "../..";


// Import Proto
import { v388 } from "../../wmmt/v388.proto";
import * as wmproto from "../../wmmt/v388.proto";


// Get Main Draw Ranking
export async function getMainDrawRanking(body: v388.protobuf.LoadGhostCompetitionRankingRequest, ghostCompetitionSchedule: any, date: number)
{
    // Get Current OCM Period and All User's Record
    let competitionParticipant = await prisma.ghostCompetitionBattleRecord.findMany({
        where:{
            competitionDbId: ghostCompetitionSchedule.dbId,
        },
        orderBy: [
            {
                result: 'desc'
            },
            {
                periodId: 'desc'
            }
        ],
        distinct: ['carId']
    });

    let numOfParticipants = competitionParticipant.length;
    let periodId: number = competitionParticipant[0].periodId;
    let ownRecordsRanking = false;
    let ownRecords;
    let topRecords: wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry[] = [];
    let playedShopName = Config.getConfig().shopName;  // default value
    let maxNumber = 150;

    if(numOfParticipants < 151)
    {
        maxNumber = numOfParticipants;
    }

    if(numOfParticipants > 0)
    {
        if(competitionParticipant[0]?.playedShopName !== null && competitionParticipant[0]?.playedShopName !== undefined)
        {
            playedShopName = competitionParticipant[0].playedShopName;
        }

        for(let i=0; i<maxNumber; i++)
        {
            if(competitionParticipant[i].carId === body.carId && ownRecordsRanking === false)
            {
                // User car records
                ownRecords = wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry.create({
                    rank: i + 1,
                    result: competitionParticipant[i].result,
                    carId: competitionParticipant[i].carId,
                    name: competitionParticipant[i].name,
                    regionId: competitionParticipant[i].regionId,
                    model: competitionParticipant[i].model,
                    visualModel: competitionParticipant[i].visualModel,
                    defaultColor: competitionParticipant[i].defaultColor,
                    title: competitionParticipant[i].title,
                    level: competitionParticipant[i].level,
                    playedShopName: playedShopName,
                    playedAt: competitionParticipant[i].playedAt
                });

                ownRecordsRanking = true;
            }

            // Generate OCM Top Records
            topRecords.push(wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry.create({
                rank: i + 1,
                result: competitionParticipant[i].result,
                carId: competitionParticipant[i].carId,
                name: competitionParticipant[i].name,
                regionId: competitionParticipant[i].regionId,
                model: competitionParticipant[i].model,
                visualModel: competitionParticipant[i].visualModel,
                defaultColor: competitionParticipant[i].defaultColor,
                title: competitionParticipant[i].title,
                level: competitionParticipant[i].level,
                playedShopName: playedShopName,
                playedAt: competitionParticipant[i].playedAt
            }));
        }
    }

    if(!ownRecordsRanking)
    {
        for(let i=maxNumber; i<numOfParticipants; i++)
        {
            if(competitionParticipant[i].carId === body.carId)
            {
                ownRecords = wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry.create({
                    rank: i + 1,
                    result: competitionParticipant[i].result,
                    carId: competitionParticipant[i].carId,
                    name: competitionParticipant[i].name,
                    regionId: competitionParticipant[i].regionId,
                    model: competitionParticipant[i].model,
                    visualModel: competitionParticipant[i].visualModel,
                    defaultColor: competitionParticipant[i].defaultColor,
                    title: competitionParticipant[i].title,
                    level: competitionParticipant[i].level,
                    playedShopName: playedShopName,
                    playedAt: competitionParticipant[i].playedAt
                });

                break;
            }
        }
    }

    return { numOfParticipants, ownRecords, topRecords, periodId }
}


// Get Qualifying Day Ranking
export async function getQualifyingRanking(body: v388.protobuf.LoadGhostCompetitionRankingRequest, ghostCompetitionSchedule: any)
{
    let competitionParticipant = await prisma.ghostCompetitionBattleRecord.findMany({
        where:{
            competitionDbId: ghostCompetitionSchedule.dbId,
            periodId: 0
        },
        orderBy: {
            result: 'desc'
        },
        distinct: ['carId']
    });

    let numOfParticipants = 0;
    let periodId = 0;
    let ownRecordsRanking = false;
    let ownRecords = null;
    let topRecords: wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry[] = [];
    let playedShopName = Config.getConfig().shopName; // default value

    if(numOfParticipants > 0)
    {
        for(let i=0; i<numOfParticipants; i++)
        {
            if(competitionParticipant[i].carId === body.carId && ownRecordsRanking === false)
            {
                // User car records
                ownRecords = wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry.create({
                    rank: i + 1,
                    result: competitionParticipant[i].result,
                    carId: competitionParticipant[i].carId,
                    name: competitionParticipant[i].name,
                    regionId: competitionParticipant[i].regionId,
                    model: competitionParticipant[i].model,
                    visualModel: competitionParticipant[i].visualModel,
                    defaultColor: competitionParticipant[i].defaultColor,
                    title: competitionParticipant[i].title,
                    level: competitionParticipant[i].level,
                    playedShopName: playedShopName,
                    playedAt: competitionParticipant[i].playedAt
                });

                ownRecordsRanking = true;

                // Break
                i = numOfParticipants;
                break;
            }
        }
    }

    return { numOfParticipants, ownRecords, topRecords, periodId }
}


// Get Final Ranking
export async function getFinalRanking(body: v388.protobuf.LoadGhostCompetitionRankingRequest, ghostCompetitionSchedule: any)
{
    let competitionParticipant = await prisma.ghostCompetitionBattleRecord.findMany({
        where:{
            competitionDbId: ghostCompetitionSchedule.dbId,
            periodId: 999999999 // final ranking mark
        },
        orderBy: {
            result: 'desc'
        },
        distinct: ['carId']
    });

    let numOfParticipants = competitionParticipant.length;
    let periodId = 999999999;
    let ownRecordsRanking = false;
    let ownRecords;
    let topRecords: wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry[] = [];
    let playedShopName = Config.getConfig().shopName; // default value
    let maxNumber = 150;

    if(numOfParticipants < 151)
    {
        maxNumber = numOfParticipants;
    }

    if(numOfParticipants > 0)
    {
        for(let i=0; i<maxNumber; i++)
        {
            if(competitionParticipant[i].carId === body.carId && ownRecordsRanking === false)
            {
                // User car records
                ownRecords = wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry.create({
                    rank: i + 1,
                    result: competitionParticipant[i].result,
                    carId: competitionParticipant[i].carId,
                    name: competitionParticipant[i].name,
                    regionId: competitionParticipant[i].regionId,
                    model: competitionParticipant[i].model,
                    visualModel: competitionParticipant[i].visualModel,
                    defaultColor: competitionParticipant[i].defaultColor,
                    title: competitionParticipant[i].title,
                    level: competitionParticipant[i].level,
                    playedShopName: playedShopName,
                    playedAt: competitionParticipant[i].playedAt
                });

                ownRecordsRanking = true;
            }

            // Generate OCM Top Records
            topRecords.push(wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry.create({
                rank: i + 1,
                result: competitionParticipant[i].result,
                carId: competitionParticipant[i].carId,
                name: competitionParticipant[i].name,
                regionId: competitionParticipant[i].regionId,
                model: competitionParticipant[i].model,
                visualModel: competitionParticipant[i].visualModel,
                defaultColor: competitionParticipant[i].defaultColor,
                title: competitionParticipant[i].title,
                level: competitionParticipant[i].level,
                playedShopName: playedShopName,
                playedAt: competitionParticipant[i].playedAt
            }));
        }
    }

    if(!ownRecordsRanking)
    {
        for(let i=maxNumber; i<numOfParticipants; i++)
        {
            if(competitionParticipant[i].carId === body.carId)
            {
                ownRecords = wmproto.v388.protobuf.LoadGhostCompetitionRankingResponse.Entry.create({
                    rank: i + 1,
                    result: competitionParticipant[i].result,
                    carId: competitionParticipant[i].carId,
                    name: competitionParticipant[i].name,
                    regionId: competitionParticipant[i].regionId,
                    model: competitionParticipant[i].model,
                    visualModel: competitionParticipant[i].visualModel,
                    defaultColor: competitionParticipant[i].defaultColor,
                    title: competitionParticipant[i].title,
                    level: competitionParticipant[i].level,
                    playedShopName: playedShopName,
                    playedAt: competitionParticipant[i].playedAt
                });
                
                break;
            }
        }
    }

    return { numOfParticipants, ownRecords, topRecords, periodId }
}