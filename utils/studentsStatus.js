module.exports = async function (model) {

  const status = await model.aggregate([ { $match : { role : "user" } }, { $group: { _id: 'All', avgStudent: { $avg: "$userPoint" } } } ]);

  return status[0];
};