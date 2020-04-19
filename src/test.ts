import { MongoClient } from "mongodb";

// import { QueryBuilder } from "../poseidon-query-builder/entity-query-builder";
// import querystring = require("qs");

// var query = new QueryBuilder()
//   .where("_id", "$eq", "EntityTypeEditor")
//   .include("components.component", q => q.include("_createdBy", q => q.whereFields("name", "$eq", "name")))
//   .include("components.children.component", q => q.whereFields("_id", "$eq", "_id").include("_createdBy", q => q))
//   .getResult();

// var stringfied = querystring.stringify(query, { strictNullHandling: true, encode: false });
// var parsed = querystring.parse(stringfied, { strictNullHandling: true });
// console.log(stringfied);
// console.log(JSON.stringify(parsed));

MongoClient.connect("mongodb://localhost:27017/poseidon", { useUnifiedTopology: true }).then(async cli => {
  var db = cli.db("poseidon");
  let item = 0;
  while (true) {
    console.log(item++);
    await db.collection("View").insertOne({
      description: "teste",
      components: [
        {
          component: {
            _id: "5e4826dc7418b320f2e299ac"
          },
          props: {
            style: {
              minWidth: "100%",
              border: "1px dashed",
              padding: "3px"
            }
          },
          children: [
            {
              component: {
                _id: "5e4826dc7418b320f2e299ac"
              },
              props: {
                style: {
                  minHeight: "20px",
                  border: "1px dashed",
                  padding: "3px"
                }
              },
              children: [
                {
                  component: {
                    _id: "5e4826dc7418b320f2e299ac"
                  },
                  props: {
                    style: {
                      minHeight: "20px",
                      border: "1px dashed",
                      padding: "3px"
                    }
                  }
                },
                {
                  component: {
                    _id: "5e4826dc7418b320f2e299ac"
                  },
                  props: {
                    style: {
                      minHeight: "20px",
                      border: "1px dashed",
                      padding: "3px"
                    }
                  }
                }
              ]
            },
            {
              component: {
                _id: "5e4826dc7418b320f2e299ac"
              },
              props: {
                style: {
                  minHeight: "20px",
                  border: "1px dashed",
                  padding: "3px"
                }
              },
              children: [
                {
                  component: {
                    _id: "5e4826dc7418b320f2e299ac"
                  },
                  props: {
                    style: {
                      minHeight: "20px",
                      border: "1px dashed",
                      padding: "3px"
                    }
                  }
                },
                {
                  component: {
                    _id: "5e4826dc7418b320f2e299ac"
                  },
                  props: {
                    style: {
                      minHeight: "20px",
                      border: "1px dashed",
                      padding: "3px"
                    }
                  }
                }
              ]
            },
            {
              component: {
                _id: "5e4826dc7418b320f2e299ac"
              },
              props: {
                style: {
                  minHeight: "20px",
                  border: "1px dashed",
                  padding: "3px"
                }
              },
              children: [
                {
                  component: {
                    _id: "5e4826dc7418b320f2e299ac"
                  },
                  props: {
                    style: {
                      minHeight: "20px",
                      border: "1px dashed",
                      padding: "3px"
                    }
                  }
                },
                {
                  component: {
                    _id: "5e4826dc7418b320f2e299ac"
                  },
                  props: {
                    style: {
                      minHeight: "20px",
                      border: "1px dashed",
                      padding: "3px"
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          component: {
            _id: "5e4826dc7418b320f2e299ac"
          },
          props: {
            style: {
              minWidth: "100%",
              border: "1px dashed",
              padding: "3px"
            }
          },
          children: [
            {
              component: {
                _id: "5e4826dc7418b320f2e299ac"
              },
              props: {
                style: {
                  minHeight: "20px",
                  border: "1px dashed",
                  padding: "3px"
                }
              }
            },
            {
              component: {
                _id: "5e4826dc7418b320f2e299ac"
              },
              props: {
                style: {
                  minHeight: "20px",
                  border: "1px dashed",
                  padding: "3px"
                }
              }
            },
            {
              component: {
                _id: "5e4826dc7418b320f2e299ac"
              },
              props: {
                style: {
                  minHeight: "20px",
                  border: "1px dashed",
                  padding: "3px"
                }
              }
            }
          ]
        }
      ]
    });
  }
});
