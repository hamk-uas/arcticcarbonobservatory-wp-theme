var chartsJson = {
    "charts": [
        {
            "id": "global",
            "title": "Every chart",
            "title_fi": "Jokainen kuvaaja",
            "title_sv": "Varje diagram",
            "hidden": true,
            "sourceTypes": [
                {
                    "id": "mgmt_event",
                    "events": true
                }
            ]
        },
        {
            "id": "satelliteImages",
            "title": "Satellite images",
            "title_fi": "Satelliittikuvat",
            "title_sv": "Satellitbilder",
            "sourceCategoryList": [
                {
                    "id": "tropomi_ch4_image",
                    "title": "tropomi daily methane",
                    "description": "Tropomi data.",
                }
            ],
            "sourceTypes": [
                {
                    "id": "tropomi_ch4",
                    "sourceCategoryId": "tropomi_ch4_image",
                    "satelliteImages": true
                }
            ],
        }
    ]
};