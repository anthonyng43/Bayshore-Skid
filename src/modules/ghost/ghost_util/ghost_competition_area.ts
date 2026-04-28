// For Default Ghost (not really used)
// Competition (OCM) Area
export async function competitionArea(competition_id: number)
{
    // Initial Value
    let areaVal = 0;
    let rampVal = 0;

    switch (competition_id) 
    {
        // 1st - C1
        case 1:
        {
            // GID_RUNAREA_C1
            areaVal = 0;
    
            // GID_RAMP_C1_OUT_SHIBA
            rampVal = 0;
            break;
        }
        // 2nd - Osaka
        case 2:
        { 
            // GID_RUNAREA_OSAKA
            areaVal = 7;
    
            // GID_RAMP_OOSAKA_DOUTONBORI
            rampVal = 22;
            break;
        }
    
        // 3rd - Fukuoka
        case 3:
        { 
            // GID_RUNAREA_FUKUOKA
            areaVal = 8;
    
            // GID_RAMP_FUKUOKA_WEST_MEIHAMA
            rampVal = 23;
            break;
        }
    
        // 4th - Nagoya
        case 4:
        { 
            // GID_RUNAREA_NAGOYA
            areaVal = 6;
    
            // GID_RAMP_NAGOYA_MARUNOUCHI
            rampVal = 21;
            break;
        }
    }

    return { areaVal, rampVal };
}