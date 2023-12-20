var gtts = require("node-gtts")("tr");
var path = require("path");

const da = () => {
  gtts.save(
    "audio.mp3",
    "İstanbul, Türkiye'nin başkentidir. Hem Avrupa hem de Asya kıtalarında yer alır ve 15 milyondan fazla nüfusa sahiptir. İstanbul zengin tarihi, güzel mimarisi ve canlı kültürü ile tanınır. İstanbul'daki bazı popüler turistik yerler arasında Ayasofya, Topkapı Sarayı ve Sultanahmet Camii bulunmaktadır.",
    function () {
      console.log("save done");
    }
  );
};
da();
