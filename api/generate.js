module.exports = function handler(req, res) {
  return res.status(200).json({
    status: "OK",
    message: "GymGenie API radi!"
  });
};
