import { prisma } from "../../..";


// Competition (OCM) Tally
export async function competitionTally(competition_db_id: number, periodId: number, ended: boolean)
{
    // Competition (OCM) is still on going
    if(ended === false)
    {
        console.log('Tallying Competition (OCM)');

        // Get user that playing OCM day
        let userCompetitionBattleRecord = await prisma.ghostCompetitionBattleRecord.findMany({ 
            where: {
                competitionDbId: competition_db_id,
            },
            orderBy: {
                result: 'desc',
            }
        });

        // OCM Battle record data found
        if(userCompetitionBattleRecord)
        {
            let no1Advantage = null;
            let currentResult = 0;

            for(let i=0; i<userCompetitionBattleRecord.length; i++)
            {
                // Get the No 1 Advantage
                if(no1Advantage === null)
                {
                    console.log('Making the No 1 (Target) Ghost Trail');

                    // Save the No 1 advantage result for calculating other record later
                    no1Advantage = userCompetitionBattleRecord[i].result;

                    // Get No 1 ghost trail data
                    let getNo1Trail = await prisma.ghostCompetitionGhostTrail.findFirst({
                        where: {
                            carId: userCompetitionBattleRecord[i].carId,
                            competitionDbId: competition_db_id,
                        }
                    })

                    // No 1 Ghost trail data found
                    if(getNo1Trail)
                    {
                        // Move the data to ghost competition target ghost trail table
                        await prisma.ghostCompetitionTargetGhostTrail.create({
                            data: {
                                carId: getNo1Trail.carId,
                                area: getNo1Trail.area,
                                ramp: getNo1Trail.ramp,
                                trail: getNo1Trail.trail,
                                competitionDbId: getNo1Trail.competitionDbId,

                                // Minus it before, for tallying previous period record (Line 15).. +1 again to make it main draw period again 
                                periodId: periodId, // Set it to current period

                                playedAt: getNo1Trail.playedAt,
                                tunePower: getNo1Trail.tunePower,
                                tuneHandling: getNo1Trail.tuneHandling,
                            }
                        })
                    }
                }

                // No 1 advantage result is bigger than 0 (negative advantage like +10m)
                if(no1Advantage >= 0)
                {
                    // User advantage result is lower than 0 (negative advantage like -10m)
                    if(userCompetitionBattleRecord[i].result <= 0)
                    {
                        // POSITIVE value No 1 advantage + NEGATIVE value from user advantage record
                        currentResult = no1Advantage + Math.abs(userCompetitionBattleRecord[i].result);

                        // Expecting NEGATIVE result for non No 1 user
                        currentResult = -Math.abs(currentResult); 
                    }
                    // User advantage result is bigger than 0 (negative advantage like +10m)
                    else
                    {
                        // POSITIVE value No 1 advantage - POSITIVE value from user advantage record
                        currentResult = userCompetitionBattleRecord[i].result - no1Advantage;
                    }
                }
                // No 1 advantage result is lower than 0 (negative advantage like -10m)
                else
                {
                    // NEGATIVE value No 1 advantage + NEGATIVE value from user advantage record
                    currentResult = no1Advantage + Math.abs(userCompetitionBattleRecord[i].result);

                    // Just in case result is POSITIVE
                    if(currentResult > 0)
                    {
                        // Expecting NEGATIVE result for non No 1 user
                        currentResult = -Math.abs(currentResult);
                    }
                    // else {} result already NEGATIVE
                }

                // Update the Ghost Competition Battle Record Data
                let data: any = {
                    carId: userCompetitionBattleRecord[i].carId,
                    result: currentResult,
                    competitionDbId: competition_db_id,

                    // Minus it before, for tallying previous period record (Line 15).. +1 again to make it main draw period again 
                    periodId: periodId // Set it to current period
                }

                // Update the user's car data for the current period
                await prisma.ghostCompetitionBattleRecord.updateMany({
                    where: {
                        carId: userCompetitionBattleRecord[i].carId,
                        competitionDbId: competition_db_id
                    },
                    data: data
                });

                // Create Tally data
                await prisma.ghostCompetitionTally.create({
                    data: data
                })

                // Create the No 1 Target Data
                if(i === 0)
                {
                    console.log('Making the No 1 (Target) Ghost Data');

                    // Create No 1 ghost data
                    await prisma.ghostCompetitionTarget.create({
                        data: {
                            carId: data.carId,
                            competitionDbId: data.competitionDbId,
                            periodId: data.periodId
                        }
                    });
                }

                // CarState check
                let carState = await prisma.carState.findFirst({
                    where: {
                        dbId: userCompetitionBattleRecord[i].carId
                    }
                });

                if (carState?.competitionState !== 2) {
                    await prisma.carState.update({
                        where: {
                            dbId: userCompetitionBattleRecord[i].carId
                        },
                        data: {
                            competitionState: 2 // Update to Qualified
                        }
                    });
                }
            }
        }
    }
    // Competition (OCM) is ended
    else
    {
        console.log('Tallying data for final result');

        // Get user that playing OCM qualifying day
        let ghostCompetitionTally = await prisma.ghostCompetitionBattleRecord.findMany({ 
            where: {
                competitionDbId: competition_db_id,
            },
            orderBy: {
                result: 'desc'
            }
        });

        // Main Draw battle record data found
        if(ghostCompetitionTally)
        {
            let no1Advantage = null;
            let currentResult = 0;

            // Get the No 1 Advantage
            if(no1Advantage === null)
            {
                for(let i=0; i<ghostCompetitionTally.length; i++)
                {
                    // Get the No 1 Advantage
                    if(no1Advantage === null)
                    {
                        console.log('Making the No 1 (Target) Ghost Trail');

                        // Save the No 1 advantage result for calculating other record later
                        no1Advantage = ghostCompetitionTally[i].result;

                        // Get No 1 ghost trail data
                        let getNo1Trail = await prisma.ghostCompetitionGhostTrail.findFirst({
                            where: {
                                carId: ghostCompetitionTally[i].carId,
                                competitionDbId: competition_db_id,
                            },
                            orderBy: {
                                playedAt: 'desc'
                            }
                        })

                        // No 1 Ghost trail data found
                        if(getNo1Trail)
                        {
                            // Move the data to ghost competition target ghost trail table
                            await prisma.ghostCompetitionTargetGhostTrail.create({
                                data: {
                                    carId: getNo1Trail.carId,
                                    area: getNo1Trail.area,
                                    ramp: getNo1Trail.ramp,
                                    trail: getNo1Trail.trail,
                                    competitionDbId: getNo1Trail.competitionDbId,

                                    // Last Tally Period
                                    periodId: periodId, // 999999999
                                    
                                    playedAt: getNo1Trail.playedAt,
                                    tunePower: getNo1Trail.tunePower,
                                    tuneHandling: getNo1Trail.tuneHandling,
                                }
                            })
                        }
                    }

                    // No 1 advantage result is bigger than 0 (negative advantage like +10m)
                    if(no1Advantage >= 0)
                    {
                        // User advantage result is lower than 0 (negative advantage like -10m)
                        if(ghostCompetitionTally[i].result <= 0)
                        {
                            // POSITIVE value No 1 advantage + NEGATIVE value from user advantage record
                            currentResult = no1Advantage + Math.abs(ghostCompetitionTally[i].result);

                            // Expecting NEGATIVE result for non No 1 user
                            currentResult = -Math.abs(currentResult); 
                        }
                        // User advantage result is bigger than 0 (negative advantage like +10m)
                        else
                        {
                            // POSITIVE value No 1 advantage - POSITIVE value from user advantage record
                            currentResult = ghostCompetitionTally[i].result - no1Advantage;
                        }
                    }
                    // No 1 advantage result is lower than 0 (negative advantage like -10m)
                    else
                    {
                        // NEGATIVE value No 1 advantage + NEGATIVE value from user advantage record
                        currentResult = no1Advantage + Math.abs(ghostCompetitionTally[i].result);

                        // Just in case result is POSITIVE
                        if(currentResult > 0)
                        {
                            // Expecting NEGATIVE result for non No 1 user
                            currentResult = -Math.abs(currentResult);
                        }
                        // else {} result already NEGATIVE
                    }

                    // Moving data to Competition (OCM) Tally
                    let data: any = {
                        carId: ghostCompetitionTally[i].carId,
                        result: currentResult,
                        competitionDbId: competition_db_id,

                        // Last Tally Period
                        periodId: periodId, // 999999999
                    }

                    // Update the user's car data for the current period
                    await prisma.ghostCompetitionBattleRecord.updateMany({
                        where: {
                            carId: ghostCompetitionTally[i].carId,
                            competitionDbId: competition_db_id
                        },
                        data: data
                    });

                    // Create tally data
                    await prisma.ghostCompetitionTally.create({
                        data: data
                    });

                    if(i === 0)
                    {
                        console.log('Making the No 1 (Target) Ghost Data');

                        // Create No 1 ghost data
                        await prisma.ghostCompetitionTarget.create({
                            data: {
                                carId: data.carId,
                                competitionDbId: data.competitionDbId,
                                periodId: data.periodId
                            }
                        });
                    }

                    if (i <= 100)
                    {
                        await prisma.carState.update({
                            where: {
                                dbId: ghostCompetitionTally[i].carId
                            },
                            data: {
                                competitionState: 4
                            }
                        });
                    }
                    else
                    {
                        await prisma.carState.update({
                            where: {
                                dbId: ghostCompetitionTally[i].carId
                            },
                            data: {
                                competitionState: 1
                            }
                        });
                    }
                }
            }
        }
    }

    console.log('Tally Completed!');
}

// Give nameplate reward
export async function competitionGiveNamePlateReward(competition_id: number, competition_db_id: number)
{
    let getCarParticipant = await prisma.ghostCompetitionBattleRecord.findMany({
        where: {
            competitionDbId: competition_db_id,
        },
        orderBy: {
            result: 'desc'
        },
        select: {
            carId: true
        }
    });

    if(getCarParticipant.length > 0) {
    
        console.log('Giving Competition (OCM) ID ' +competition_id+ ' OCM Rewards');

        // Top 100 for GP Reward
        let top100 = getCarParticipant.splice(100).map(car=>car.carId);

        // Participation Award
        for(let i=0; i<getCarParticipant.length; i++)
        {
            let participantCar = await prisma.car.findFirst({
                where: {
                    carId: getCarParticipant[i].carId
                }
            });

            if (participantCar && competition_id == 1 && participantCar.ownedNameplates <= 31) {
                await prisma.car.update({
                    where: {
                        carId: participantCar.carId
                    },
                    data: {
                        ownedNameplates: (((participantCar.ownedNameplates + 1) * 2) - 1)
                    }
                })
            } else if ( participantCar && competition_id > 1 && participantCar.ownedNameplates <= 16777215) {
                await prisma.car.update({
                    where: {
                        carId: participantCar.carId
                    },
                    data: {
                        ownedNameplates: (((participantCar.ownedNameplates + 1) * 32) - 1)
                    }
                })
            }
        }

        // Ranking within the top certain number
        for(let i=0; i<top100.length; i++)
        {
            let participantCar = await prisma.car.findFirst({
                where: {
                    carId: getCarParticipant[i].carId
                }
            });

            if (participantCar && competition_id == 1 && participantCar.ownedNameplates <= 63) {
                await prisma.car.update({
                    where: {
                        carId: participantCar.carId
                    },
                    data: {
                        ownedNameplates: (((participantCar.ownedNameplates + 1) * 4) - 1)
                    }
                })
            } else if ( participantCar && competition_id > 1 && participantCar.ownedNameplates <= 16777215) {
                await prisma.car.update({
                    where: {
                        carId: participantCar.carId
                    },
                    data: {
                        ownedNameplates: (((participantCar.ownedNameplates + 1) * 64) - 1)
                    }
                })
            }
        }

        console.log('Competition (OCM) : ' +competition_id+ ' Rewards has been Distributed');
    }
}