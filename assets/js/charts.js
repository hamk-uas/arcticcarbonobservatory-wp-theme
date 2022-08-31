var chartsJson = {
    "charts": [
        {
            "id": "satelliteImages",
            "title": "Satellite images",
            "title_fi": "Satelliittikuvat",
            "title_sv": "Satellitbilder",
            "sourceCategoryList": [
                {
                    "id": "ndviNormalizedSumImage",
                    "title": "Normalized cumulative NDVI",
                    "title_fi": "Normalisoitu kumulatiivinen NDVI",
                    "title_sv": "Normaliserad kumulativ NDVI",
                    "description": "Normalized cumulative NDVI sum calculated from the beginning of the growing season is a good predictor of yield, already early on in the growing season.",
                    "description_fi": "Korkea normalisoitu kumulatiivinen NDVI-summa kasvukauden alussa on hyvä ennuste sadon määrälle.",
                    "description_sv": "En hög normaliserad kumlativ NDVI-summa i början av växtsäsongen är ett bra tecken med tanke på skörden"
                },
                {
                    "id": "ndviImage",
                    "title": "NDVI",
                    "description": "NDVI measures the photosynthetic capacity of the vegetation. It is controlled by the amount of vegetation and the condition of the plants. 0–0.2 very little vegetation, 0.2–0.4 sparse vegetation, 0.4–0.6 moderate vegetation, 0.6–1.0 dense vegetation.",
                    "description_fi": "NDVI arvioi kasvillisuuden fotosynteesipotentiaalia. NDVI:n suuruuteen vaikuttavat kasvillisuuden määrä ja kunto. 0–0.2 hyvin vähän kasvillisuutta, 0.2–0.4 harva kasvillisuus, 0.4–0.6 kohtalainen kasvillisuus, 0.6–1.0 tiheä kasvillisuus.",
                    "description_sv": "NDVI mäter vegetationens fotosyntespotential.Värdet på NDVI påverkas av mängden och tillståndet av vegetationen. 0–0.2 väldigt liten mängd vegetation, 0.2–0.4 gles vegetation, 0.4–0.6 måttlig vegetation, 0.6–1.0 tät vegetation."

                },
                {
                    "id": "laiImage",
                    "title": "LAI",
                    "description": "Leaf area index (LAI) describes the amount of vegetation canopy in the area. Measured as m² of leaf surface (top side) to land area.",
                    "description_fi": "Lehtialaindeksi (LAI) mittaa lehtipinta-alan määrää alueella. Se määritellään kasvillisuuden yksipuolisena lehtipinta-alana maapinta-alaa kohden (yksikkö m² / m²).",
                    "description_sv": "Bladarealindex (LAI) mäter mängden bladyta på ett område. Det mäts som m² av bladytan (övre sidan) mot landytan."
                }
            ],
            "sourceTypes": [
                {
                    "id": "ndviImage",
                    "sourceCategoryId": "ndviImage"
                },
                {
                    "id": "laiImage",
                    "sourceCategoryId": "laiImage"
                },
                {
                    "id": "ndviNormalizedSumImage",
                    "sourceCategoryId": "ndviNormalizedSumImage"
                },
                {
                    "id": "mgmt_event"
                }
            ],
        },
        {
            "id": "cumNdvi",
            "title": "Cumulative normalized difference vegetation index",
            "title_fi": "Kumulatiivinen normalisoitu kasvillisuusindeksi",
            "title_sv": "Kumulativt normaliserad vegetationsindex",
            "description": "Cumulative sum of NDVI for a predefined 244-day growing season 31.3.–31.10.. Early growing season NDVI sum is a good predictor of yield. For days lacking satellite observations, NDVI was linearly interpolated from the surrounding satellite observations, or extrapolated from the last NDVI observation. The theoretical maximum at season end is 244. Error bars indicate 90&nbsp;% confidence intervals.",
            "description_fi": "Kumulatiivinen NDVI-summa etukäteen määritetyn kasvukauden ajalle (31.3.–31.10, 244 päivää). Korkea NDVI-summa kasvukauden alussa on hyvä ennuste sadon määrälle. NDVI-arvo on lineaarisesti interpoloitu viereisistä havainnoista tai ekstrapoloitu viimeisestä havainnoista niille päiville, joille satelliittihavaintoa ei ole saatavilla. Teoreettinen maksimi NDVI-summalle on 244. Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
            "description_sv": "Kumulativ NDVI-summa för en förutbestämd växtsäsong (31.3–31.10, 244 dagar). En hög NDVI-summa i början av växtsäsongen är ett bra tecken med tanke på skörden. NDVI-summan interpoleras linjärt från intilliggande observationer eller extrapoleras från de senaste observationerna för de dagar då satellitobservationer inte är tillgängliga. Det teoretiska maxvärdet för NDVI -summan är 244.  Felstaplarna anger konfidensintervall på 90&nbsp;%.",
            "yLabel": "cumulative NDVI (days)",
            "yLabel_fi": "kumulatiivinen NDVI",
            "yLabel_sv": "kumulativt NDVI (dagar)",
            "defaults": {
                "yMin": 0,
                "yMax": 150
            },
            "relatedSatelliteImage": {
                "chart": "satelliteImages",
                "sourceCategoryId": "ndviNormalizedSumImage"
            },
            "sourceTypes": [
                {
                    "id": "sentinel_ndvi_sum",
                    "dots": true,
                    "lines": true,
                    "gapDetectTimeThreshold": 10368000000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "ndvi_cum",
                        "fractiles": [
                            {
                                "startField": "ndvi_cum_F005",
                                "endField": "ndvi_cum_F095"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "ndvi",
            "title": "Normalized difference vegetation index (NDVI)",
            "title_fi": "Normalisoitu kasvillisuusindeksi (NDVI)",
            "title_sv": "Normaliserad vegetationsindex (NDVI)",
            "description": "NDVI measures the photosynthetic capacity of the vegetation. It is controlled by the amount of vegetation and the condition of the plants. 0–0.2 very little vegetation, 0.2–0.4 sparse vegetation, 0.4–0.6 moderate vegetation, 0.6–1.0 dense vegetation. Error bars indicate 90&nbsp;% confidence intervals.",
            "description_fi": "NDVI arvioi kasvillisuuden fotosynteesipotentiaalia. NDVI:n suuruuteen vaikuttavat kasvillisuuden määrä ja kunto. 0–0.2 hyvin vähän kasvillisuutta, 0.2–0.4 harva kasvillisuus, 0.4–0.6 kohtalainen kasvillisuus, 0.6–1.0 tiheä kasvillisuus. Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
            "description_sv": "NDVI mäter vegetationens fotosyntespotential.Värdet på NDVI påverkas av mängden och tillståndet av vegetationen. 0–0.2 väldigt liten mängd vegetation, 0.2–0.4 gles vegetation, 0.4–0.6 måttlig vegetation, 0.6–1.0 tät vegetation.  Felstaplarna anger konfidensintervall på 90&nbsp;%.",
            "yLabel": "NDVI",
            "defaults": {
                "yMin": 0,
                "yMax": 1
            },
            "relatedSatelliteImage": {
                "chart": "satelliteImages",
                "sourceCategoryId": "ndviImage"
            },
            "sourceTypes": [
                {
                    "id": "sentinel",
                    "dots": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "ndvi",
                        "fractiles": [
                            {
                                "startField": "ndvi_F005",
                                "endField": "ndvi_F095"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "lai",
            "title": "Leaf area index (LAI)",
            "title_fi": "Lehtialaindeksi (LAI)",
            "title_sv": "Bladarealindex (LAI)",
            "description": "Leaf area index describes the amount of vegetation canopy in the area. Measured as m² of leaf surface (top side) to land area. Error bars indicate 90&nbsp;% confidence intervals.",
            "description_fi": "Lehtialaindeksi mittaa lehtipinta-alan määrää alueella. Se määritellään kasvillisuuden yksipuolisena lehtipinta-alana maapinta-alaa kohden (yksikkö m² / m²). Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
            "description_sv": "Bladarealindex mäter mängden bladyta på ett område. Det mäts som m² av bladytan (övre sidan) mot landytan. Felstaplarna anger konfidensintervall på 90&nbsp;%.",
            "yLabel": "LAI (m² / m²)",
            "defaults": {
                "yMin": 0,
                "yMax": 8
            },
            "relatedSatelliteImage": {
                "chart": "satelliteImages",
                "sourceCategoryId": "laiImage"
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "basgra_n_hindcast",
                    "title": "BASGRA_N hindcast",
                    "title_fi": "BASGRA_N takautuva mallinnus",
                    "title_sv": "BASGRA_N återanalys"
                },
                {
                    "id": "basgra_n_forecast",
                    "title": "BASGRA_N forecast",
                    "title_fi": "BASGRA_N ennuste",
                    "title_sv": "BASGRA_N prognos"
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "title": "BASGRA-BGC hindcast",
                    "title_fi": "BASGRA-BGC takautuva mallinnus",
                    "title_sv": "BASGRA-BGC återanalys"
                },
                {
                    "id": "basgra_bgc_forecast",
                    "title": "BASGRA-BGC forecast",
                    "title_fi": "BASGRA-BGC ennuste",
                    "title_sv": "BASGRA-BGC prognos"
                },
                {
                    "id": "stics_hindcast",
                    "title": "STICS hindcast",
                    "title_fi": "STICS takautuva mallinnus",
                    "title_sv": "STICS återanalys",
                },
                {
                    "id": "stics_forecast",
                    "title": "STICS forecast",
                    "title_fi": "STICS ennuste",
                    "title_sv": "STICS prognos"
                },
                {
                    "id": "ldndc_hindcast",
                    "title": "LDNDC hindcast",
                    "title_fi": "LDNDC takautuva mallinnus",
                    "title_sv": "LDNDC återanalys",
                },
                {
                    "id": "ldndc_forecast",
                    "title": "LDNDC forecast",
                    "title_fi": "LDNDC ennuste",
                    "title_sv": "LDNDC prognos"
                }
            ],
            "sourceTypes": [
                {
                    "id": "sentinel",
                    "sourceCategoryId": "observation",
                    "dots": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "lai",
                        "fractiles": [
                            {
                                "startField": "lai_F005",
                                "endField": "lai_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_n_hindcast",
                    "sourceCategoryId": "basgra_n_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LAI_mean",
                        "fractiles": [
                            {
                                "startField": "LAI_F005",
                                "endField": "LAI_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_n_forecast",
                    "sourceCategoryId": "basgra_n_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LAI_mean",
                        "fractiles": [
                            {
                                "startField": "LAI_F005",
                                "endField": "LAI_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "sourceCategoryId": "basgra_bgc_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LAI_mean",
                        "fractiles": [
                            {
                                "startField": "LAI_F005",
                                "endField": "LAI_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_forecast",
                    "sourceCategoryId": "basgra_bgc_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LAI_mean",
                        "fractiles": [
                            {
                                "startField": "LAI_F005",
                                "endField": "LAI_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "stics_hindcast",
                    "sourceCategoryId": "stics_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LAI_mean",
                        "fractiles": [
                            {
                                "startField": "LAI_F005",
                                "endField": "LAI_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "stics_forecast",
                    "sourceCategoryId": "stics_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LAI_mean",
                        "fractiles": [
                            {
                                "startField": "LAI_F005",
                                "endField": "LAI_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "ldndc_hindcast",
                    "sourceCategoryId": "ldndc_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LAI_mean",
                        "fractiles": [
                            {
                                "startField": "LAI_F005",
                                "endField": "LAI_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "ldndc_forecast",
                    "sourceCategoryId": "ldndc_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LAI_mean",
                        "fractiles": [
                            {
                                "startField": "LAI_F005",
                                "endField": "LAI_F095"
                            }
                        ]
                    }
                },
            ]
        },
        {
            "id": "CO2concentration",
            "title": "CO₂ concentration",
            "title_fi": "CO₂-pitoisuus",
            "title_sv": "CO₂ koncentration",
            "yLabel": "CO₂ concentration (ppm)",
            "yLabel_fi": "CO₂-pitoisuus (ppm)",
            "yLabel_sv": "CO₂ koncentration (ppm)",
            "minMaxIncludesZero": true,
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                }
            ],
            "defaults": {
                "yMin": 0,
                "yMax": 1000,
                "timeAggregationSettingIndex": 0
            },
            "sourceTypes": [
                {
                    "id": "co2concentration",
                    "integrationTime": 1800000,
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "CO2concentration"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                },
                {
                    "id": "concentrations",
                    "integrationTime": 1800000,
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "CO2concentration"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                }
            ]
        },
        {
            "id": "N2Oconcentration",
            "title": "N₂O concentration",
            "title_fi": "N₂O-pitoisuus",
            "title_sv": "N₂O koncentration",
            "yLabel": "N₂O concentration (ppm)",
            "yLabel_fi": "N₂O-pitoisuus (ppm)",
            "yLabel_sv": "N₂O koncentration (ppm)",
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                }
            ],
            "defaults": {
                "yMin": 0,
                "yMax": 0.6,
                "timeAggregationSettingIndex": 0
            },
            "sourceTypes": [
                {
                    "id": "concentrations",
                    "integrationTime": 1800000,
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "N2Oconcentration"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                },
            ]
        },
        {
            "id": "CO2flux",
            "title": "CO₂ flux",
            "title_fi": "CO₂-vuo",
            "title_sv": "CO₂ -flödet",
            "description": "CO₂ flux is the exchange of CO₂ between the land and the atmosphere. Positive values represent carbon release from land to the atmosphere, negative values represent carbon sink to the land. The carbon balance of the whole field is determined by the CO₂ fluxes, the carbon removed as harvested biomass and by the possible imported carbon as organic fertilizers.",
            "description_fi": "Hiilidioksidivuo mittaa hiilidioksidin kulkeutumista ilmakehän ja maaekosysteemin (maaperä ja kasvillisuus) välillä. Positiivinen arvo tarkoittaa päästöä maaekosysteemistä ilmakehään ja negatiivinen arvo hiilidioksidin sitoutumista maaekosysteemiin. Koko pellon hiilitase määrittyy hiilidioksidivuon, poistetun hiilen (korjattu sato) ja lisätyn hiilen (lannoitus) perusteella.",
            "description_sv": "CO₂ -flödet är utbytet av CO₂ mellan marken och atmosfären. Positiva värden representerar kolutsläpp från marken till atmosfären, negativa värden representerar kolbindning i marken. Kolbalansen på hela åkern bestäms av CO₂ -flödet, av kolet som avlägsnas som skördad biomassa och av eventuellt tillsatt kol som organisk gödsel. ",
            "yLabel": "CO₂ flux (mg / m² / s)",
            "yLabel_fi": "CO₂-vuo (mg / m² / s)",
            "yLabel_sv": "CO₂ -flödet (mg / m² / s)",
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 604800000
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 2592000000
                }
            ],
            "defaults": {
                "yMin": -1,
                "yMax": 1,
                "timeAggregationSettingIndex": "auto"
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation"
                },
                {
                    "id": "observation_filtered",
                    "title": "Observation (filtered)",
                    "title_fi": "Havainto (suodatettu)",
                    "title_sv": "Observation (filtrerad)"
                },
                {
                    "id": "observation_gapfilled",
                    "title": "Observation (gapfilled)",
                    "title_fi": "Havainto (paikattu)",
                    "title_sv": "Observation (lappad)"
                },
                {
                    "id": "basgra_n_hindcast",
                    "title": "BASGRA_N hindcast",
                    "title_fi": "BASGRA_N takautuva mallinnus",
                    "title_sv": "BASGRA_N återanalys",
                    "description": "Hindcast (past) and forecast (future) are predicted values by the BASGRA_N process-based grassland model (<a href=\"https://doi.org/10.1016/j.ecolmodel.2019.108925\">Höglind et al., 2020, <i>Ecol. Modelling</i></a>). The 90&nbsp;% confidence intervals for hindcast and forecast are generated by 250 ensemble members, with different combinations of model parameters, initial conditions and meteorological drivers. The forecasts update daily around 16 UTC.",
                    "description_fi": "Takautuva mallinnus ja ennuste on tehty nurmimaille kehitetyllä prosessipohjaisella BASGRA_N -mallilla <a href=\"https://doi.org/10.1016/j.ecolmodel.2019.108925\">Höglind et al., 2020, <i>Ecol. Modelling</i></a>). 90&nbsp;% luottamusvälit on laskettu tekemällä 250 erillistä mallinnusta erilaisilla malliparametrien, mallinnuksen alkutilojen ja meteorologisten muuttujien yhdistelmillä. Ennuste päivittyy joka päivä n. klo 16:00 (UTC).",
                    "description_sv": "Retroaktiv modellering samt prognosen görs med den processbaserade BASGRA_N modellen utvecklad för gräsmarker <a href=\"https://doi.org/10.1016/j.ecolmodel.2019.108925\">Höglind et al., 2020, <i>Ecol. Modelling</i></a>). 90&nbsp;% konfidensintervaller har beräknats genom att göra 250 separata modelleringar med olika kombinationer av modellparametrar, modellering av initialtillstånd och meteorologiska variabler. Prognosen uppdateras varje dag ca kl. 16:00 (UTC)."
                },
                {
                    "id": "basgra_n_forecast",
                    "title": "BASGRA_N forecast",
                    "title_fi": "BASGRA_N ennuste",
                    "title_sv": "BASGRA_N prognos"
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "title": "BASGRA-BGC hindcast",
                    "title_fi": "BASGRA-BGC takautuva mallinnus",
                    "title_sv": "BASGRA-BGC återanalys",
                    "description": "Hindcast (past) shows predicted values by the BASGRA-BGC process-based grassland model (<a href=\"https://doi.org/10.1016/j.scitotenv.2020.144385\">Huang et al., 2021, <i>Sci. Total Environ. </i></a>). The 90&nbsp;% confidence intervals for hindcast and forecast are generated by 100 ensemble members, with different combinations of model parameters and initial conditions.",
                    "description_fi": "Takautuva mallinnus on tehty nurmimaille kehitetyllä prosessipohjaisella BASGRA-BGC -mallilla (<a href=\"https://doi.org/10.1016/j.scitotenv.2020.144385\">Huang et al., 2021, <i>Sci. Total Environ. </i></a>). 90&nbsp;% luottamusvälit on laskettu tekemällä 100 erillistä mallinnusta erilaisilla malliparametrien ja mallinnuksen alkutilojen yhdistelmillä.",
                    "description_sv": "Retroaktiv modellering görs med den processbaserade BASGRA-BGC -modellen utvecklad för gräsmarker (<a href=\"https://doi.org/10.1016/j.scitotenv.2020.144385\">Huang et al., 2021, <i>Sci. Total Environ. </i></a>). 90&nbsp;% konfidensintervaller har beräknats genom att göra 100 separata modelleringar med olika kombinationer av modellparametrar och modellering av initialtillstånd."
                },
                {
                    "id": "basgra_bgc_forecast",
                    "title": "BASGRA-BGC forecast",
                    "title_fi": "BASGRA-BGC ennuste",
                    "title_sv": "BASGRA-BGC prognos"
                },
                {
                    "id": "stics_hindcast",
                    "title": "STICS hindcast",
                    "title_fi": "STICS takautuva mallinnus",
                    "title_sv": "STICS återanalys",
                    "description": "Hindcast (past) shows predicted values by the STICS process-based crop model (Brisson et al., <a href=\"https://doi.org/10.1051/agro:19980501\">1998</a>, <a href=\"https://doi.org/10.1051/agro:19980501\">2002</a>, <i>Agronomie</i>). The 90&nbsp;% confidence intervals for hindcast and forecast are generated by 250 ensemble members, with different combinations of model parameters and initial conditions.",
                    "description_fi": "Takautuva mallinnus on tehty prosessipohjaisella STICS -mallilla  (Brisson et al., <a href=\"https://doi.org/10.1051/agro:19980501\">1998</a>, <a href=\"https://doi.org/10.1051/agro:19980501\">2002</a>, <i>Agronomie</i>). 90&nbsp;% luottamusvälit on laskettu tekemällä 250 erillistä mallinnusta erilaisilla malliparametrien ja mallinnuksen alkutilojen yhdistelmillä.",
                    "description_sv": "Retroaktiv modellering görs med den processbaserade STICS -modellen (Brisson et al., <a href=\"https://doi.org/10.1051/agro:19980501\">1998</a>, <a href=\"https://doi.org/10.1051/agro:19980501\">2002</a>, <i>Agronomie</i>). 90&nbsp;% konfidensintervaller har beräknats genom att göra 250 separata modelleringar med olika kombinationer av modellparametrar och modellering av initialtillstånd."
                },
                {
                    "id": "stics_forecast",
                    "title": "STICS forecast",
                    "title_fi": "STICS ennuste",
                    "title_sv": "STICS prognos"
                },
                {
                    "id": "ldndc_hindcast",
                    "title": "LDNDC hindcast",
                    "title_fi": "LDNDC takautuva mallinnus",
                    "title_sv": "LDNDC återanalys",
                },
                {
                    "id": "ldndc_forecast",
                    "title": "LDNDC forecast",
                    "title_fi": "LDNDC ennuste",
                    "title_sv": "LDNDC prognos"
                }
            ],
            "sourceTypes": [
                {
                    "id": "datasense",
                    "sourceCategoryId": "observation",
                    "gappy": true,
                    "dots": true,
                    "integrationTime": 86400000,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC",
                        "val": "CO2Flux24h"
                    },
                    "description": "CO₂ flux is measured using the chamber method.",
                    "description_fi": "CO₂-vuo on mitattu kammiomenetelmällä.",
                    "description_sv": "CO₂-flödet mättes med kammarmetoden."
                },
                {
                    "id": "flux",
                    "sourceCategoryId": "observation",
                    "gappy": true,
                    "lines": true,
                    "integrationTime": -1800000,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "CO2flux_raw",
                        "flags": "CO2flux_flags"
                    },
                    "description": "CO₂ flux is measured using the eddy-covariance method.",
                    "description_fi": "CO₂-vuo on mitattu pyörrekovarianssimenetelmällä.",
                    "description_sv": "CO₂-flödet mättes med virvelkovarians metoden."
                },
                {
                    "id": "flux",
                    "sourceCategoryId": "observation_filtered",
                    "lines": true,
                    "gappy": true,
                    "integrationTime": -1800000,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "CO2flux_filtered",
                        "flags": "CO2flux_flags"
                    },
                    "description": "CO₂ flux is measured using the eddy-covariance method.",
                    "description_fi": "CO₂-vuo on mitattu pyörrekovarianssimenetelmällä.",
                    "description_sv": "CO₂-flödet mättes med virvelkovarians metoden."
                },
                {
                    "id": "flux",
                    "sourceCategoryId": "observation_gapfilled",
                    "lines": true,
                    "integrationTime": -1800000,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "CO2flux",
                        "flags": "CO2flux_flags"
                    },
                    "description": "CO₂ flux is measured using the eddy-covariance method.",
                    "description_fi": "CO₂-vuo on mitattu pyörrekovarianssimenetelmällä.",
                    "description_sv": "CO₂-flödet mättes med virvelkovarians metoden."
                },
                {
                    "id": "basgra_n_hindcast",
                    "sourceCategoryId": "basgra_n_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2flux_mean",
                        "fractiles": [
                            {
                                "startField": "CO2flux_F005",
                                "endField": "CO2flux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_n_forecast",
                    "sourceCategoryId": "basgra_n_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2flux_mean",
                        "fractiles": [
                            {
                                "startField": "CO2flux_F005",
                                "endField": "CO2flux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "sourceCategoryId": "basgra_bgc_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2flux_mean",
                        "fractiles": [
                            {
                                "startField": "CO2flux_F005",
                                "endField": "CO2flux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_forecast",
                    "sourceCategoryId": "basgra_bgc_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2flux_mean",
                        "fractiles": [
                            {
                                "startField": "CO2flux_F005",
                                "endField": "CO2flux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "stics_hindcast",
                    "sourceCategoryId": "stics_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2flux_mean",
                        "fractiles": [
                            {
                                "startField": "CO2flux_F005",
                                "endField": "CO2flux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "stics_forecast",
                    "sourceCategoryId": "stics_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2flux_mean",
                        "fractiles": [
                            {
                                "startField": "CO2flux_F005",
                                "endField": "CO2flux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "ldndc_hindcast",
                    "sourceCategoryId": "ldndc_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2flux_mean",
                        "fractiles": [
                            {
                                "startField": "CO2flux_F005",
                                "endField": "CO2flux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "ldndc_forecast",
                    "sourceCategoryId": "ldndc_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2flux_mean",
                        "fractiles": [
                            {
                                "startField": "CO2flux_F005",
                                "endField": "CO2flux_F095"
                            }
                        ]
                    }
                },
            ],
            "disabledSourceTypes": [
                {
                    "id": "datasense",
                    "sourceCategoryId": "observation",
                    "gappy": true,
                    "stairs": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "CO2Flux"
                    }
                },
            ]
        },
        {
            "id": "N2Oflux",
            "title": "N₂O flux",
            "title_fi": "N₂O-vuo",
            "title_sv": "N₂O -flödet",
            "description": "N₂O flux is the exchange of N₂O between the land and the atmosphere. Positive values represent release from land to the atmosphere, negative values represent sink to the land.",
            "yLabel": "N₂O flux (mg / m² / s)",
            "yLabel_fi": "N₂O-vuo (mg / m² / s)",
            "yLabel_sv": "N₂O -flödet (mg / m² / s)",
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 604800000
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 2592000000
                }
            ],
            "defaults": {
                "yMin": -0.002,
                "yMax": 0.008,
                "timeAggregationSettingIndex": "auto"
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation"
                },
                {
                    "id": "observation_filtered",
                    "title": "Observation (filtered)",
                    "title_fi": "Havainto (suodatettu)",
                    "title_sv": "Observation (filtrerad)"
                },
                {
                    "id": "observation_gapfilled",
                    "title": "Observation (gapfilled)",
                    "title_fi": "Havainto (paikattu)",
                    "title_sv": "Observation (lappad)"
                },
                {
                    "id": "basgra_n_hindcast",
                    "title": "BASGRA_N hindcast",
                    "title_fi": "BASGRA_N takautuva mallinnus",
                    "title_sv": "BASGRA_N återanalys"
                },
                {
                    "id": "basgra_n_forecast",
                    "title": "BASGRA_N forecast",
                    "title_fi": "BASGRA_N ennuste",
                    "title_sv": "BASGRA_N prognos"
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "title": "BASGRA-BGC hindcast",
                    "title_fi": "BASGRA-BGC takautuva mallinnus",
                    "title_sv": "BASGRA-BGC återanalys"
                },
                {
                    "id": "basgra_bgc_forecast",
                    "title": "BASGRA-BGC forecast",
                    "title_fi": "BASGRA-BGC ennuste",
                    "title_sv": "BASGRA-BGC prognos"
                },
                {
                    "id": "stics_hindcast",
                    "title": "STICS hindcast",
                    "title_fi": "STICS takautuva mallinnus",
                    "title_sv": "STICS återanalys"
                },
                {
                    "id": "stics_forecast",
                    "title": "STICS forecast",
                    "title_fi": "STICS ennuste",
                    "title_sv": "STICS prognos"
                }
            ],
            "sourceTypes": [
                {
                    "id": "flux",
                    "sourceCategoryId": "observation",
                    "gappy": true,
                    "lines": true,
                    "integrationTime": -1800000,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "N2Oflux_raw",
                        "flags": "N2Oflux_flags"
                    },
                    "description": "N₂O flux is measured using the eddy-covariance method.",
                    "description_fi": "N₂O-vuo on mitattu pyörrekovarianssimenetelmällä.",
                    "description_sv": "N₂O-flödet mättes med virvelkovarians metoden."
                },
                {
                    "id": "flux",
                    "sourceCategoryId": "observation_filtered",
                    "lines": true,
                    "gappy": true,
                    "integrationTime": -1800000,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "N2Oflux_filtered",
                        "flags": "N2Oflux_flags"
                    },
                    "description": "N₂O flux is measured using the eddy-covariance method.",
                    "description_fi": "N₂O-vuo on mitattu pyörrekovarianssimenetelmällä.",
                    "description_sv": "N₂O-flödet mättes med virvelkovarians metoden."
                },
                {
                    "id": "flux",
                    "sourceCategoryId": "observation_gapfilled",
                    "lines": true,
                    "integrationTime": -1800000,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "N2Oflux",
                        "flags": "N2Oflux_flags"
                    },
                    "description": "N₂O flux is measured using the eddy-covariance method.",
                    "description_fi": "N₂O-vuo on mitattu pyörrekovarianssimenetelmällä.",
                    "description_sv": "N₂O-flödet mättes med virvelkovarians metoden."
                },
                {
                    "id": "basgra_n_hindcast",
                    "sourceCategoryId": "basgra_n_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "N2Oflux_mean",
                        "fractiles": [
                            {
                                "startField": "N2Oflux_F005",
                                "endField": "N2Oflux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_n_forecast",
                    "sourceCategoryId": "basgra_n_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "N2Oflux_mean",
                        "fractiles": [
                            {
                                "startField": "N2Oflux_F005",
                                "endField": "N2Oflux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "sourceCategoryId": "basgra_bgc_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "N2Oflux_mean",
                        "fractiles": [
                            {
                                "startField": "N2Oflux_F005",
                                "endField": "N2Oflux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_forecast",
                    "sourceCategoryId": "basgra_bgc_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "N2Oflux_mean",
                        "fractiles": [
                            {
                                "startField": "N2Oflux_F005",
                                "endField": "N2Oflux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "stics_hindcast",
                    "sourceCategoryId": "stics_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "N2Oflux_mean",
                        "fractiles": [
                            {
                                "startField": "N2Oflux_F005",
                                "endField": "N2Oflux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "stics_forecast",
                    "sourceCategoryId": "stics_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "N2Oflux_mean",
                        "fractiles": [
                            {
                                "startField": "N2Oflux_F005",
                                "endField": "N2Oflux_F095"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "soilMoisture",
            "title": "Soil moisture",
            "title_fi": "Maaperän kosteus",
            "title_sv": "Jordmånens fuktighet",
            "description": "Soil moisture is a key driver for plant and microbe activity. In addition it tracks the water budget of the soil. 0.5 m³ water/m³ soil = 100 mm water in 20 cm depth of soil.",
            "description_fi": "Maaperän kosteus säätelee kasvillisuuden ja maaperän mikrobien aktiivisuutta sekä seuraa maaperän vesitasetta. Puoli kuutiota (0.5 m³) vettä yhtä kuutiota maaperää kohden vastaa 100 mm vettä 20 cm syvyydessä.",
            "description_sv": "Jordmånens fuktighet reglerar aktiviteten hos växtligheten och markens mikrober, samt följer med jordmånens vattenbalans. En halv kubikmeter (0.5 m³)  vatten per kubikmeter jord motsvarar 100 mm vatten på 20 cm djup.",
            "yLabel": "soil moisture (m³ / m³)",
            "yLabel_fi": "maaperän kosteus (m³ / m³)",
            "yLabel_sv": "jordmånens fuktighet (m³ / m³)",
            "minMaxIncludesZero": true,
            "timeAggregationStatistic": "mean",
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                }
            ],
            "defaults": {
                "yMin": 0,
                "yMax": 1,
                "timeAggregationSettingIndex": "auto"
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "basgra_n_hindcast",
                    "title": "BASGRA_N hindcast",
                    "title_fi": "BASGRA_N takautuva mallinnus",
                    "title_sv": "BASGRA_N återanalys",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                },
                {
                    "id": "basgra_n_forecast",
                    "title": "BASGRA_N forecast",
                    "title_fi": "BASGRA_N ennuste",
                    "title_sv": "BASGRA_N prognos"
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "title": "BASGRA_BGC hindcast",
                    "title_fi": "BASGRA_BGC takautuva mallinnus",
                    "title_sv": "BASGRA_BGC återanalys",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                },
                {
                    "id": "basgra_bgc_forecast",
                    "title": "BASGRA_BGC forecast",
                    "title_fi": "BASGRA_BGC ennuste",
                    "title_sv": "BASGRA_BGC prognos"
                },
                {
                    "id": "stics_hindcast",
                    "title": "STICS hindcast",
                    "title_fi": "STICS takautuva mallinnus",
                    "title_sv": "STICS återanalys",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                },
                {
                    "id": "stics_forecast",
                    "title": "STICS forecast",
                    "title_fi": "STICS ennuste",
                    "title_sv": "STICS prognos"
                }
            ],
            "sourceTypes": [
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilMoisture120cm"
                    },
                    "parameters": {
                        "height_cm": -120
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilMoisture90cm"
                    },
                    "parameters": {
                        "height_cm": -90
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilMoisture60cm"
                    },
                    "parameters": {
                        "height_cm": -60
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilMoisture35cm"
                    },
                    "parameters": {
                        "height_cm": -35
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilMoisture30cm"
                    },
                    "parameters": {
                        "height_cm": -30
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilMoisture10cm"
                    },
                    "parameters": {
                        "height_cm": -10
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilMoisture"
                    },
                    "parameters": {
                        "height_cm": "-"
                    }
                },
                {
                    "id": "datasense",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "Volume"
                    },
                    "gapDetectTimeThreshold": 10800000
                },
                {
                    "id": "basgra_n_hindcast",
                    "sourceCategoryId": "basgra_n_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "SoilMoisture_mean",
                        "fractiles": [
                            {
                                "startField": "SoilMoisture_F005",
                                "endField": "SoilMoisture_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_n_forecast",
                    "sourceCategoryId": "basgra_n_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "SoilMoisture_mean",
                        "fractiles": [
                            {
                                "startField": "SoilMoisture_F005",
                                "endField": "SoilMoisture_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "sourceCategoryId": "basgra_bgc_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "SoilMoisture_mean",
                        "fractiles": [
                            {
                                "startField": "SoilMoisture_F005",
                                "endField": "SoilMoisture_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_forecast",
                    "sourceCategoryId": "basgra_bgc_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "SoilMoisture_mean",
                        "fractiles": [
                            {
                                "startField": "SoilMoisture_F005",
                                "endField": "SoilMoisture_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "stics_hindcast",
                    "sourceCategoryId": "stics_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "SoilMoisture_mean",
                        "fractiles": [
                            {
                                "startField": "SoilMoisture_F005",
                                "endField": "SoilMoisture_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "stics_forecast",
                    "sourceCategoryId": "stics_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "SoilMoisture_mean",
                        "fractiles": [
                            {
                                "startField": "SoilMoisture_F005",
                                "endField": "SoilMoisture_F095"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "temperature",
            "title": "Temperature",
            "title_fi": "Lämpötila",
            "title_sv": "Temperatur",
            "description": "Soil temperature controls plant and microbe activity. Increase of 10 °C roughly doubles growth and decomposition. Air temperature controls soil temperature in the long term.",
            "description_fi": "Maaperän lämpötila säätelee kasvillisuuden ja maaperän mikrobien aktiivisuutta. Karkeasti arvioituna 10 asteen lämpötilanousu tuplaa kasvun ja maatumisen nopeuden. Pitkällä aikavälillä maaperän lämpötilaa säätelee ilman lämpötila.",
            "description_sv": "Jordmånens temperatur reglerar aktiviteten hos växtligheten och markens mikrober. Grovt uppskattat skulle en temperaturökning på 10 grader fördubbla tillväxthastigheten och förmultningen. På långsikt regleras jordmånens temperatur av luftens temperatur.",
            "yLabel": "temperature (°C)",
            "yLabel_fi": "lämpötila (°C)",
            "yLabel_sv": "temperatur (°C)",
            "timeAggregationStatistic": "minMeanMax",
            "defaults": {
                "yMin": -50,
                "yMax": 50
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "ecmwf_forecast",
                    "title": "ECMWF forecast",
                    "description": "For the forecast, also the 50&nbsp;% and 80&nbsp;% ranges are shown.",
                    "description_fi": "Ennustelle on myös näkyvissä 50&nbsp;% ja 80&nbsp;% luottamusvälit.",
                    "description_sv": "För prognosen visas också intervallerna 50&nbsp;% och 80&nbsp;%.",
                    "title_fi": "ECMWF ennuste",
                    "title_sv": "ECMWF prognos"
                }
            ],
            "sourceTypes": [
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil120cm"
                    },
                    "parameters": {
                        "height_cm": -120
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil100cm"
                    },
                    "parameters": {
                        "height_cm": -100
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil60cm"
                    },
                    "parameters": {
                        "height_cm": -60
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil50cm"
                    },
                    "parameters": {
                        "height_cm": -50
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil35cm"
                    },
                    "parameters": {
                        "height_cm": -35
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil30cm"
                    },
                    "parameters": {
                        "height_cm": -30
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil20cm"
                    },
                    "parameters": {
                        "height_cm": -20
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil10cm"
                    },
                    "parameters": {
                        "height_cm": -10
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureSoil5cm"
                    },
                    "parameters": {
                        "height_cm": -5
                    }
                },
                {
                    "id": "datasense",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "Temperature"
                    },
                    "parameters": {
                        "height_cm": "-"
                    },
                    "gapDetectTimeThreshold": 10800000
                },
                {
                    "id": "fmimeteo",
                    "sourceCategoryId": "observation",
                    "gapDetectTimeThreshold": 1800000,
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Time",
                        "val": "AirTemperature"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                },
                {
                    "id": "smhimeteo",
                    "sourceCategoryId": "observation",
                    "integrationTime": -3600000,
                    "gapDetectTimeThreshold": 3600000,
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "date",
                        "val": "TemperaturePast1h"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "TemperatureAir"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                },
                {
                    "id": "ecmwf_forecast",
                    "sourceCategoryId": "ecmwf_forecast",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "Temperature_F050",
                        "fractiles": [
                            {
                                "startField": "Temperature_F010",
                                "endField": "Temperature_F090"
                            },
                            {
                                "startField": "Temperature_F025",
                                "endField": "Temperature_F075"
                            }
                        ]
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                }
            ]
        },
        {
            "id": "precipitation",
            "title": "Precipitation",
            "title_fi": "Sademäärä",
            "title_sv": "Nederbörd",
            "description": "Precipitation is the amount of rainfall.",
            "description_fi": "Sademäärä kertoo tietyssä ajassa eri olomuodoissa maahan sataneen veden määrän.",
            "description_sv": "Nederbörd är regnmängden.",
            "yLabel": "precipitation (mm)",
            "yLabel_fi": "sademäärä (mm)",
            "yLabel_sv": "nederbörd (mm)",
            "minMaxIncludesZero": true,
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "sum",
                    "period": 21600000
                },
                {
                    "enabled": true,
                    "statistic": "sum",
                    "period": 86400000
                }
            ],
            "defaults": {
                "yMin": 0,
                "yMax": 240,
                "autoZoom": true,
                "timeAggregationSettingIndex": "auto"
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "ecmwf_forecast",
                    "title": "ECMWF forecast",
                    "title_fi": "ECMWF ennuste",
                    "title_sv": "ECMWF prognos",
                    "description": "For the forecast, also the 50&nbsp;% and 80&nbsp;% ranges are shown.",
                    "description_fi": "Ennustelle on myös näkyvissä 50&nbsp;% ja 80&nbsp;% luottamusvälit.",
                    "description_sv": "För prognosen visas också intervallerna 50&nbsp;% och 80&nbsp;%."
                }
            ],
            "sourceTypes": [
                {
                    "id": "datasense",
                    "sourceCategoryId": "observation",
                    "bars": true,
                    "integrationTime": -1800000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "Precipitation"
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "bars": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "Precipitation"
                    }
                },
                {
                    "id": "pluvio",
                    "sourceCategoryId": "observation",
                    "bars": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "Precipitation"
                    }
                },
                {
                    "id": "fmimeteo",
                    "sourceCategoryId": "observation",
                    "bars": true,
                    "integrationTime": 3600000,
                    "seriesCSVFields": {
                        "date": "Time",
                        "val": "PrecipitationAmount"
                    }
                },
                {
                    "id": "fmimeteo",
                    "sourceCategoryId": "observation",
                    "bars": true,
                    "integrationTime": 86400000,
                    "seriesCSVFields": {
                        "date": "Time",
                        "val": "PrecipitationAmount24h"
                    }
                },
                {
                    "id": "smhimeteo",
                    "sourceCategoryId": "observation",
                    "bars": true,
                    "integrationTime": 86400000,
                    "seriesCSVFields": {
                        "date": "date",
                        "val": "PrecipPast24hAt06"
                    }
                },
                {
                    "id": "ecmwf_forecast",
                    "sourceCategoryId": "ecmwf_forecast",
                    "bars": true,
                    "integrationTime": -21600000,
                    "seriesCSVFields": {
                        "date": "Date_TotalPrecipitation",
                        "val": "TotalPrecipitation_F050",
                        "fractiles": [
                            {
                                "startField": "TotalPrecipitation_F010",
                                "endField": "TotalPrecipitation_F090"
                            },
                            {
                                "startField": "TotalPrecipitation_F025",
                                "endField": "TotalPrecipitation_F075"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "relativeHumidity",
            "title": "Relative humidity",
            "title_fi": "Suhteellinen kosteus",
            "title_sv": "Relativ luftfuktighet",
            "description": "Air humidity controls evapotranspiration.",
            "description_fi": "Ilman suhteellinen kosteus säätelee kokonaishaihduntaa.",
            "description_sv": "Luftfuktigheten styr evapotranspirationen.",
            "yLabel": "relative humidity (%)",
            "yLabel_fi": "suhteellinen kosteus (%)",
            "yLabel_sv": "relativ luftfuktighet (%)",
            "timeAggregationStatistic": "minMeanMax",
            "defaults": {
                "yMin": 0,
                "yMax": 100
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "ecmwf_forecast",
                    "title": "ECMWF forecast",
                    "title_fi": "ECMWF ennuste",
                    "title_sv": "ECMWF prognos",
                    "description": "For the forecast, also the 50&nbsp;% and 80&nbsp;% ranges are shown.",
                    "description_fi": "Ennustelle on myös näkyvissä 50&nbsp;% ja 80&nbsp;% luottamusvälit.",
                    "description_sv": "För prognosen visas också intervallerna 50&nbsp;% och 80&nbsp;%."
                }
            ],
            "sourceTypes": [
                {
                    "id": "fmimeteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "gapDetectTimeThreshold": 1800000,
                    "seriesCSVFields": {
                        "date": "Time",
                        "val": "RelativeHumidity"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                },
                {
                    "id": "smhimeteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": -3600000,
                    "gapDetectTimeThreshold": 3600000,
                    "seriesCSVFields": {
                        "date": "date",
                        "val": "Humidity"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                },
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "RelativeHumidity"
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                },
                {
                    "id": "ecmwf_forecast",
                    "sourceCategoryId": "ecmwf_forecast",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "RelativeHumidity_F050",
                        "fractiles": [
                            {
                                "startField": "RelativeHumidity_F010",
                                "endField": "RelativeHumidity_F090"
                            },
                            {
                                "startField": "RelativeHumidity_F025",
                                "endField": "RelativeHumidity_F075"
                            }
                        ]
                    },
                    "parameters": {
                        "height_cm": "+"
                    }
                }
            ]
        },
        {
            "id": "electricalConductivity",
            "title": "Electrical conductivity",
            "title_fi": "Sähköjohtavuus",
            "title_sv": "Elektrisk konduktivitet",
            "description": "Soil EC describes the concentration of ions in soil. Depends on fertilization and soil type. Less than 1 dS/m = 1000 µS/cm is ok.",
            "description_fi": "Maaperän sähkönjohtavuus kertoo maaperän ionipitoisuudesta. Tähän vaikuttaa maaperän tyyppi ja lannoitus. Alle 1 dS/m (= 1000 µS/cm) on hyvä arvo.",
            "description_sv": "Jordmånens elektriska konduktivitetbeskriver jordens ionhalt. Den påverkas av jordmånstypen och gödslingen. Ett bra värde ligger under 1 dS/m (= 1000 µS/cm)",
            "yLabel": "conductivity (µS / cm)",
            "yLabel_fi": "johtavuus (µS / cm)",
            "yLabel_sv": "konduktivitet (µS / cm)",
            "timeAggregationStatistic": "minMeanMax",
            "defaults": {
                "yMin": 0,
                "yMax": 1000,
                "autoZoom": true
            },
            "sourceTypes": [
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ElectricalConductivity120cm"
                    },
                    "parameters": {
                        "height_cm": -120
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ElectricalConductivity90cm"
                    },
                    "parameters": {
                        "height_cm": -90
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ElectricalConductivity60cm"
                    },
                    "parameters": {
                        "height_cm": -60
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ElectricalConductivity35cm"
                    },
                    "parameters": {
                        "height_cm": -35
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ElectricalConductivity10cm"
                    },
                    "parameters": {
                        "height_cm": -10
                    }
                },
                {
                    "id": "datasense",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "Conductivity"
                    },
                    "gapDetectTimeThreshold": 10800000
                }
            ]
        },
        {
            "id": "soilRedoxPotential",
            "title": "Soil redox potential",
            "yLabel": "redox potential (mV)",
            "timeAggregationStatistic": "minMeanMax",
            "defaults": {
                "yMin": -1000,
                "yMax": 1000,
                "autoZoom": true
            },
            "sourceTypes": [
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "RedoxPotential120cm"
                    },
                    "parameters": {
                        "height_cm": -120
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "RedoxPotential90cm"
                    },
                    "parameters": {
                        "height_cm": -90
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "RedoxPotential60cm"
                    },
                    "parameters": {
                        "height_cm": -60
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "RedoxPotential35cm"
                    },
                    "parameters": {
                        "height_cm": -35
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "RedoxPotential10cm"
                    },
                    "parameters": {
                        "height_cm": -10
                    }
                }
            ]
        },
        {
            "id": "soilWaterPotential",
            "title": "Soil water potential",
            "title_fi": "Vesipotentiaali",
            "yLabel": "soil water potential (kPa)",
            "yLabel_fi": "vesipotentiaali (kPa)",
            "timeAggregationStatistic": "minMeanMax",
            "defaults": {
                "yMin": -1,
                "yMax": 1,
                "autoZoom": true
            },
            "sourceTypes": [
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilWaterPotential120cm"
                    },
                    "parameters": {
                        "height_cm": -120
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilWaterPotential90cm"
                    },
                    "parameters": {
                        "height_cm": -90
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilWaterPotential60cm"
                    },
                    "parameters": {
                        "height_cm": -60
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilWaterPotential35cm"
                    },
                    "parameters": {
                        "height_cm": -35
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilWaterPotential10cm"
                    },
                    "parameters": {
                        "height_cm": -10
                    }
                }
            ]
        },
        {
            "id": "waterTableDepth",
            "title": "Water table depth",
            "title_fi": "Pohjaveden pinta",
            "yLabel": "Height (cm)",
            "yLabel_fi": "Korkeus (cm)",
            "timeAggregationStatistic": "minMeanMax",
            "defaults": {
                "yMin": -300,
                "yMax": 100,
                "autoZoom": true
            },
            "sourceTypes": [
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "WaterTableDepth"
                    }
                }
            ]
        },
        {
            "id": "netRadiation",
            "title": "Net radiation",
            "title_fi": "Nettosäteily",
            "title_sv": "Nettostrålning",
            "description": "Net radiation is the difference between incoming and outgoing broadband (visible to long-wave infrared) radiation (0.2–100 µm).",
            "description_fi": "Nettosäteily on tulevan ja poistuvan leveäkaistaisen (aallonpituus 0.2–100 µm) säteilyn erotus.",
            "description_sv": "Nettostrålning beskriver skillnaden mellan inkommande och utgående bredband strålning (våglängd 0.2–100 µm)",
            "yLabel": "radiation (W / m²)",
            "yLabel_fi": "säteilyteho (W / m²)",
            "yLabel_sv": "strålning (W / m²)",
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                }
            ],
            "defaults": {
                "yMin": -200,
                "yMax": 700,
                "timeAggregationSettingIndex": 0
            },
            "sourceTypes": [
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "NetRadiation"
                    }
                }
            ],
            "disabledSourceTypes": [
                {
                    "id": "flux",
                    "lines": true,
                    "integrationTime": -1800000,
                    "sourceCategoryId": "sensibleHeatFlux",
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "SensibleHeatFlux"
                    }
                }
            ]
        },
        {
            "id": "latentHeatFlux",
            "title": "Latent heat flux",
            "title_fi": "Latentti lämpövuo",
            "title_sv": "Latent värmeflöde",
            "description": "Latent heat flux is a measure of the sum of evaporation and transpiration from the land surface and vegetation. Since water vapor and CO₂ exchange are strongly coupled in the leaves, variations in carbon uptake by vegetation are linked to variations in vegetation controls on surface latent heat flux.",
            "description_fi": "Latentti lämpövuo mittaa maaekosysteemin kokonaishaihdunnan määrää (haihtuminen maaperästä ja kasvillisuuden transpiraatio). Latentilla lämpövuolla on suuri vaikutus hiilenkiertoon, koska vesihöyryn ja hiilidioksidin vaihtuminen kasvillisuudessa ovat vahvasti toisiinsa kytkeytyneitä.",
            "description_sv": "Latent värmeflöde mäter ekosystemets totala avdunstning (markens avdunstning och växtlighetens transpiration). Det latenta värmeflödet har en stor betydelse för kolets kretslopp, eftersom utbytet av vattenångan och koldioxiden i växtligheten är starkt sammankopplade.",
            "yLabel": "latent heat flux (W / m²)",
            "yLabel_fi": "latentti lämpövuo (W / m²)",
            "yLabel_sv": "latent värmeflöde (W / m²)",
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                }
            ],
            "period": 86400000,
            "defaults": {
                "yMin": -200,
                "yMax": 700,
                "timeAggregationSettingIndex": 0
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "basgra_n_hindcast",
                    "title": "BASGRA_N hindcast",
                    "title_fi": "BASGRA_N takautuva mallinnus",
                    "title_sv": "BASGRA_N återanalys"
                },
                {
                    "id": "basgra_n_forecast",
                    "title": "BASGRA_N forecast",
                    "title_fi": "BASGRA_N ennuste",
                    "title_sv": "BASGRA_N prognos"
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "title": "BASGRA-BGC hindcast",
                    "title_fi": "BASGRA-BGC takautuva mallinnus",
                    "title_sv": "BASGRA-BGC återanalys"
                },
                {
                    "id": "basgra_bgc_forecast",
                    "title": "BASGRA-BGC forecast",
                    "title_fi": "BASGRA-BGC ennuste",
                    "title_sv": "BASGRA-BGC prognos"
                }
            ],
            "sourceTypes": [
                {
                    "id": "flux",
                    "lines": true,
                    "integrationTime": -1800000,
                    "sourceCategoryId": "observation",
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "LatentHeatFlux"
                    }
                },
                {
                    "id": "basgra_n_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "sourceCategoryId": "basgra_n_hindcast",
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LatentHeatFlux_mean",
                        "fractiles": [
                            {
                                "startField": "LatentHeatFlux_F005",
                                "endField": "LatentHeatFlux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "sourceCategoryId": "basgra_bgc_hindcast",
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LatentHeatFlux_mean",
                        "fractiles": [
                            {
                                "startField": "LatentHeatFlux_F005",
                                "endField": "LatentHeatFlux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_n_forecast",
                    "lines": true,
                    "sourceCategoryId": "basgra_n_forecast",
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LatentHeatFlux_mean",
                        "fractiles": [
                            {
                                "startField": "LatentHeatFlux_F005",
                                "endField": "LatentHeatFlux_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_forecast",
                    "lines": true,
                    "sourceCategoryId": "basgra_bgc_forecast",
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "LatentHeatFlux_mean",
                        "fractiles": [
                            {
                                "startField": "LatentHeatFlux_F005",
                                "endField": "LatentHeatFlux_F095"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "30minPAR",
            "title": "Photosynthetically active radiation (PAR)",
            "title_fi": "Fotosynteettisesti aktiivinen säteily (PAR)",
            "title_sv": "Fotosyntetiskt aktiv strålning (PAR)",
            "description": "PAR is the plant available amount of light (400–700 nm) per time unit. Controls actual plant growth.",
            "description_fi": "PAR kertoo yhteyttämiseen käytettävissä olevan säteilyn määrän (fotosynteettisesti aktiviinen säteily, 400–700 nm). Sillä on suuri vaikutus kasvillisuuden kasvuun.",
            "description_sv": "PAR anger mängden strålning som är tillgängligt för fotosyntesen (fotosyntetiskt aktiv strålning, 400–700 nm). Den har en stor betydelse för växtlighetens tillväxt.",
            "yLabel": "PAR (µmol / m² / s)",
            "minMaxIncludesZero": true,
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 604800000
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 2592000000
                }
            ],
            "defaults": {
                "yMin": 0,
                "yMax": 2000,
                "timeAggregationSettingIndex": "auto"
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "ecmwf_forecast",
                    "title": "ECMWF forecast",
                    "title_fi": "ECMWF ennuste",
                    "title_sv": "ECMWF prognos",
                    "description": "For the forecast, also the 50&nbsp;% and 80&nbsp;% ranges are shown.",
                    "description_fi": "Ennustelle on myös näkyvissä 50&nbsp;% ja 80&nbsp;% luottamusvälit.",
                    "description_sv": "För prognosen visas också intervallerna 50&nbsp;% och 80&nbsp;%."
                }
            ],
            "sourceTypes": [
                {
                    "id": "meteo",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "PAR"
                    }
                },
                {
                    "id": "ecmwf_forecast",
                    "sourceCategoryId": "ecmwf_forecast",
                    "stairs": true,
                    "seriesCSVFields": {
                        "date": "Date_PAR_umol",
                        "val": "PAR_umol_F050",
                        "integrationTime": "PAR_umol_integrationTime",
                        "fractiles": [
                            {
                                "startField": "PAR_umol_F010",
                                "endField": "PAR_umol_F090"
                            },
                            {
                                "startField": "PAR_umol_F025",
                                "endField": "PAR_umol_F075"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "dailyPAR",
            "title": "Photosynthetically active radiation (PAR)",
            "title_fi": "Fotosynteettisesti aktiivinen säteily (PAR)",
            "title_sv": "Fotosyntetiskt aktiv strålning (PAR)",
            "description": "PAR is the plant available amount of light (400–700 nm) per time unit. Controls actual plant growth.",
            "description_fi": "PAR kertoo yhteyttämiseen käytettävissä olevan säteilyn määrän (fotosynteettisesti aktiviinen säteily, 400–700 nm). Sillä on suuri vaikutus kasvillisuuden kasvuun.",
            "description_sv": "PAR anger mängden strålning som är tillgängligt för fotosyntesen (fotosyntetiskt aktiv strålning, 400–700 nm). Den har en stor betydelse för växtlighetens tillväxt.",
            "yLabel": "PAR (MJ / m² / day)",
            "yLabel_fi": "PAR (MJ / m² / vrk)",
            "yLabel_sv": "PAR (MJ / m² / dag)",
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                }
            ],
            "defaults": {
                "yMin": 0,
                "yMax": 50,
                "timeAggregationSettingIndex": 0
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "ecmwf_forecast",
                    "title": "ECMWF forecast",
                    "title_fi": "ECMWF ennuste",
                    "title_sv": "ECMWF prognos",
                    "description": "For the forecast, also the 50&nbsp;% and 80&nbsp;% ranges are shown.",
                    "description_fi": "Ennustelle on myös näkyvissä 50&nbsp;% ja 80&nbsp;% luottamusvälit.",
                    "description_sv": "För prognosen visas också intervallerna 50&nbsp;% och 80&nbsp;%."
                }
            ],
            "sourceTypes": [
                {
                    "id": "cams_par",
                    "sourceCategoryId": "observation",
                    "stairs": true,
                    "integrationTime": 86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "PAR"
                    }
                },
                {
                    "id": "ecmwf_forecast",
                    "sourceCategoryId": "ecmwf_forecast",
                    "stairs": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date_PAR_MJ",
                        "val": "PAR_MJ_F050",
                        "fractiles": [
                            {
                                "startField": "PAR_MJ_F010",
                                "endField": "PAR_MJ_F090"
                            },
                            {
                                "startField": "PAR_MJ_F025",
                                "endField": "PAR_MJ_F075"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "soilHeatFlux",
            "title": "Soil heat flux",
            "title_fi": "Maaperän lämpövuo",
            "title_sv": "Jordmånens värmeflöde",
            "yLabel": "heat flux (W / m²)",
            "yLabel_fi": "lämpövuo (W / m²)",
            "yLabel_sv": "värmeflöde (W / m²)",
            "timeAggregationStatistic": "mean",
            "defaults": {
                "yMin": -60,
                "yMax": 80
            },
            "sourceTypes": [
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "SoilHeatFlux5cm"
                    },
                    "parameters": {
                        "height_cm": -5
                    }
                }
            ]
        },
        {
            "id": "shortwave",
            "title": "Incoming and surface-reflected short-wave radiation",
            "title_fi": "Tuleva ja maasta heijastunut lyhytaaltoinen säteily",
            "title_sv": "Inkommande och markreflekterad kortvågig strålning",
            "description": "Incoming (down) and surface-reflected (up) visible and near-infrared radiation (300–2800 nm).",
            "description_fi": "Tuleva (down) ja maasta heijastunut (up) lyhytaaltoinen säteily (näkyvästä valosta lähi-infrapuna-alueeseen, 300–2800 nm).",
            "description_sv": "Inkommande (down) och markreflekterad (up) kortvågig strålning (från synligt ljus till nära-infraröd strålning, 300–2800 nm)",
            "yLabel": "radiation (W / m²)",
            "yLabel_fi": "säteilyteho (W / m²)",
            "yLabel_sv": "strålning (W / m²)",
            "minMaxIncludesZero": true,
            "timeAggregationSettings": [
                {
                    "enabled": false
                },
                {
                    "enabled": true,
                    "statistic": "mean",
                    "period": 86400000
                }
            ],
            "defaults": {
                "yMin": -10,
                "yMax": 1000,
                "timeAggregationSettingIndex": 0
            },
            "sourceTypes": [
                {
                    "id": "smp",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ShortwaveDown"
                    },
                    "parameters": {
                        "direction": "down"
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ShortwaveDown"
                    },
                    "parameters": {
                        "direction": "down"
                    }
                },
                {
                    "id": "smp",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ShortwaveUp"
                    },
                    "parameters": {
                        "direction": "up"
                    }
                },
                {
                    "id": "meteo",
                    "lines": true,
                    "integrationTime": 1800000,
                    "seriesCSVFields": {
                        "date": "PeriodStartUTC0",
                        "val": "ShortwaveUp"
                    },
                    "parameters": {
                        "direction": "up"
                    }
                }
            ]
        },
        {
            "id": "datasenseBatteryVoltage",
            "title": "Battery voltage",
            "title_fi": "Akkujännite",
            "title_sv": "Batterispänningen",
            "yLabel": "voltage (mV)",
            "yLabel_fi": "jännite (mV)",
            "yLabel_sv": "spänning (mV)",
            "timeAggregationStatistic": "minMeanMax",
            "defaults": {
                "yMin": 0,
                "yMax": 5000
            },
            "sourceTypes": [
                {
                    "id": "datasense",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "BatteryVoltage"
                    },
                    "gapDetectTimeThreshold": 10800000
                }
            ]
        },
        {
            "id": "yieldPotential", // Alt: "yield"
            "title": "Yield potential", // "Alt: Yield and yield potential"
            "title_fi": "Satopotentiaali", // Alt: "Sato ja satopotentiaali",
            "title_sv": "Skördepotential", // Alt: "Skörd och skördepotential",
            "yLabel": "dry matter yield potential (kg / ha)", // Alt: "dry matter yield (kg / ha)",
            "yLabel_fi": "kuiva-ainesato (kg / ha)", // (no change)
            "yLabel_sv": "torrsubstansens skördepotential (kg / ha)", // Alt: "torrsubstansskörd (kg / ha)",
            "defaults": {
                "yMin": 0,
                "yMax": 5000
            },
            "sourceCategoryList": [
                {
                    "id": "harvest",
                    "title": "Harvest",
                    "title_fi": "Sadonkorjuu",
                    "title_sv": "Skörd"
                },
                {
                    "id": "basgra_n_hindcast",
                    "title": "BASGRA_N hindcast",
                    "title_fi": "BASGRA_N takautuva mallinnus",
                    "title_sv": "BASGRA_N återanalys",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                },
                {
                    "id": "basgra_n_forecast",
                    "title": "BASGRA_N forecast",
                    "title_fi": "BASGRA_N ennuste",
                    "title_sv": "BASGRA_N prognos"
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "title": "BASGRA-BGC hindcast",
                    "title_fi": "BASGRA-BGC takautuva mallinnus",
                    "title_sv": "BASGRA-BGC återanalys",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                },
                {
                    "id": "basgra_bgc_forecast",
                    "title": "BASGRA-BGC forecast",
                    "title_fi": "BASGRA-BGC ennuste",
                    "title_sv": "BASGRA-BGC prognos"
                }
            ],
            "sourceTypes": [
                {
                    "id": "mgmt_event",
                    "sourceCategoryId": "harvest",
                    "dots": true,
                    "acceptFilter": {
                        "key": "mgmt_operations_event",
                        "val": "harvest"
                    },
                    "seriesEventFields": {
                        "date": "date",
                        "val": "harvest_yield_harvest_dw_total",
                        "altVal": "harvest_yield_harvest_dw"
                    }
                },
                {
                    "id": "basgra_n_hindcast",
                    "sourceCategoryId": "basgra_n_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "YieldPotential_mean",
                        "fractiles": [
                            {
                                "startField": "YieldPotential_F005",
                                "endField": "YieldPotential_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_n_forecast",
                    "sourceCategoryId": "basgra_n_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "YieldPotential_mean",
                        "fractiles": [
                            {
                                "startField": "YieldPotential_F005",
                                "endField": "YieldPotential_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "sourceCategoryId": "basgra_bgc_hindcast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "YieldPotential_mean",
                        "fractiles": [
                            {
                                "startField": "YieldPotential_F005",
                                "endField": "YieldPotential_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_forecast",
                    "sourceCategoryId": "basgra_bgc_forecast",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "YieldPotential_mean",
                        "fractiles": [
                            {
                                "startField": "YieldPotential_F005",
                                "endField": "YieldPotential_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "management_events",
                    "lines": true,
                    "integrationTime": -86400000,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "YieldPotential_mean",
                        "fractiles": [
                            {
                                "startField": "YieldPotential_F005",
                                "endField": "YieldPotential_F095"
                            }
                        ]
                    }
                },
            ]
        },
        {
            "id": "carbonStorage",
            "title": "Carbon storage",
            "title_fi": "Hiilivarasto",
            "title_sv": "Kolinlagring",
            "yLabel": "carbon storage (g / m²)",
            "yLabel_fi": "hiilivarasto (g / m²)",
            "yLabel_sv": "kolinlagring (g / m²)",
            "description": "Change in the carbon (C) storage per surface area since the start of measurements. Positive and increasing values indicate that the site acts as a carbon sink whereas negative and decreasing values indicate that the site is a source of atmospheric carbon. The data includes also direct effects of known farm management events. For example, a harvest event such as cutting and removal of grass causes an immediate decrease of carbon storage equal to the harvest yield of carbon, whereas an application of an organic fertilizer causes an immediate increase.",
            "description_fi": "Hiilivaraston muutos pinta-alayksikköä kohden mittausten alusta lähtien. Positiiviset ja kasvavat arvot tarkoittavat, että pelto toimii hiilinieluna, kun taas negatiiviset ja laskevat arvot, että pelto toimii hiilenlähteenä. Aineisto sisältää tiedossa olevien pelloilla tapahtuneiden toimenpiteiden vaikutuksen hiilivarastoon. Esimerkiksi pellolta satona poistettu nurmi aiheuttaa välittömän hiilivaraston pienentymisen, kun taas pelloille lisätty orgaaninen lannoite aiheuttaa välittömän hiilivaraston kasvun.",
            "description_sv": "Förändringar i kolinlagringen (C) per ytareal sedan mätningarna påbörjades. Positiva och ökande värden indikerar att stället fungerar som en kolsänka, medan negativa och sjunkande värden indikerar att stället fungerar som en kolkälla av atmosfärisk kol. Datat inkluderar också direkta effekter av vanligaste odlingsmetoder. Till exempel då en vallåker slås och materialet transporteras bort, sker en omedelbar minskning i kolinlagringen, medan en tillämpning av organisk gödsel orsakar en omedelbar ökning i kolinlagringen.",
            "defaults": {
                "yMin": -15000,
                "yMax": 15000,
                "autoZoom": true
            },
            "sourceCategoryList": [
                {
                    "id": "observation",
                    "title": "Observation",
                    "title_fi": "Havainto",
                    "title_sv": "Observation",
                    "hideTitleIfOnly": true
                },
                {
                    "id": "basgra_n_hindcast",
                    "title": "BASGRA_N hindcast",
                    "title_fi": "BASGRA_N takautuva mallinnus",
                    "title_sv": "BASGRA_N återanalys",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                },
                {
                    "id": "basgra_n_forecast",
                    "title": "BASGRA_N forecast",
                    "title_fi": "BASGRA_N ennuste",
                    "title_sv": "BASGRA_N prognos",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "title": "BASGRA-BGC hindcast",
                    "title_fi": "BASGRA-BGC takautuva mallinnus",
                    "title_sv": "BASGRA-BGC återanalys",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                },
                {
                    "id": "basgra_BGC_forecast",
                    "title": "BASGRA-BGC forecast",
                    "title_fi": "BASGRA-BGC ennuste",
                    "title_sv": "BASGRA-BGC prognos",
                    "description": "Error bars indicate 90&nbsp;% confidence intervals.",
                    "description_fi": "Virhepalkit näyttävät 90&nbsp;% luottamusvälin.",
                    "description_sv": "Felstaplarna anger konfidensintervall på 90&nbsp;%."
                }
            ],
            "sourceTypes": [
                {
                    "id": "flux",
                    "sourceCategoryId": "observation",
                    "lines": true,
                    "integrationTime": -1800000,
                    "seriesCSVFields": {
                        "date": "PeriodEndUTC0",
                        "val": "CO2cumsum"
                    }
                },
                {
                    "id": "basgra_n_hindcast",
                    "sourceCategoryId": "basgra_n_hindcast",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "cumNEE",
                        "fractiles": [
                            {
                                "startField": "cumNEE_F005",
                                "endField": "cumNEE_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_n_forecast",
                    "sourceCategoryId": "basgra_n_forecast",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "cumNEE"
                    }
                },
                {
                    "id": "basgra_bgc_hindcast",
                    "sourceCategoryId": "basgra_bgc_hindcast",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "cumNEE",
                        "fractiles": [
                            {
                                "startField": "cumNEE_F005",
                                "endField": "cumNEE_F095"
                            }
                        ]
                    }
                },
                {
                    "id": "basgra_bgc_forecast",
                    "sourceCategoryId": "basgra_bgc_forecast",
                    "lines": true,
                    "seriesCSVFields": {
                        "date": "Date",
                        "val": "cumNEE"
                    }
                }
            ]
        },
    ]
};