const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const TugOfWarGame = require("./game");

console.log("config", process.env.APP_SUPABASE_UR);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

const supabase = createClient(
  process.env.APP_SUPABASE_UR,
  process.env.APP_SUPABASE_KEY
);

const game = new TugOfWarGame();

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("joinGame", async ({ username, side }) => {
    game.addPlayer(socket.id, side);
    socket.join(side);

    // Save user to database if not exists
    const { data, error } = await supabase.from("users").insert({ username });

    if (error) console.error("Error saving user:", error);

    io.emit("gameStateUpdate", game.getGameState());

    if (game.gameState === "starting") {
      setTimeout(() => {
        game.gameState = "playing";
        io.emit("gameStateUpdate", game.getGameState());
      }, 5000); // 5 second countdown
    }
  });

  socket.on("pull", ({ side }) => {
    if (game.gameState === "playing") {
      game.pull(side);
      io.emit("gameStateUpdate", game.getGameState());

      if (game.gameState.endsWith("Win")) {
        // Save game result
        saveGameResult(game.gameState === "leftWin" ? "left" : "right");
      }
    }
  });

  socket.on("disconnect", () => {
    game.removePlayer(socket.id);
    io.emit("gameStateUpdate", game.getGameState());
    console.log("Client disconnected");
  });
});

async function saveGameResult(winningSide) {
  const { data: leftTeam, error: leftError } = await supabase
    .from("users")
    .select("id")
    .in("username", Array.from(game.leftTeam));

  const { data: rightTeam, error: rightError } = await supabase
    .from("users")
    .select("id")
    .in("username", Array.from(game.rightTeam));

  if (leftError || rightError) {
    console.error("Error fetching users:", leftError || rightError);
    return;
  }

  const gameResult = {
    winning_side: winningSide,
    left_team: leftTeam.map((user) => user.id),
    right_team: rightTeam.map((user) => user.id),
    rope_final_position: game.ropePosition,
  };

  const { error } = await supabase.from("games").insert(gameResult);

  if (error) console.error("Error saving game result:", error);

  game.reset();
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
