import * as fs from "fs";

var campaigns = [];

for (let index = 0; index < 1000; index++) {
  const campaign = {
    Title: "Camapign " + index + 1,
    PriorityNumber: index + 1,
    Criteria: [
      {
        JobCategoryType: 1,
        Name: "Tadcaster",
      },
    ],
  };

  campaigns.push(campaign);
}

fs.writeFileSync("campanhas", JSON.stringify(campaigns));
