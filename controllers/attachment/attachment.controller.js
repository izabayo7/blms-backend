// import dependencies
const {
  express,
  Chapter,
  Attachment,
  validateObjectId,
} = require("../../utils/imports");

// create router
const router = express.Router();


// delete a chapter
router.delete("/:id", async (req, res) => {
  const {
    error
  } = validateObjectId(req.params.id);
  if (error) return res.send(error.details[0].message).status(400);
  let attachment = await Attachment.findOne({
    _id: req.params.id
  });
  if (!attachment)
    return res.send(`Attachment of Code ${req.params.id} Not Found`);
  let deletedDocument = await Chapter.findOneAndDelete({
    _id: req.params.id
  });
  if (!deletedDocument) return res.send("Attachment Not Deleted").status(500);
  return res
    .send(`Attachment ${deletedDocument._id} Successfully deleted`)
    .status(200);
});

// export the router
module.exports = router;