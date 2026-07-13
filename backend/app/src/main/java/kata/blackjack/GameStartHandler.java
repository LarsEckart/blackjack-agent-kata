package kata.blackjack;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class GameStartHandler implements HttpHandler {
    private static final Logger LOGGER = Logger.getLogger(GameStartHandler.class.getName());

    private final GameSessionManager sessionManager;
    private final WeatherService weatherService;

    public GameStartHandler(GameSessionManager sessionManager, WeatherService weatherService) {
        this.sessionManager = sessionManager;
        this.weatherService = weatherService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String request = exchange.getRequestMethod() + " " + exchange.getRequestURI();
        LOGGER.info(() -> "Received " + request);

        if (!"POST".equals(exchange.getRequestMethod())) {
            LOGGER.warning(() -> "Rejected " + request + ": method not allowed");
            sendError(exchange, 405, "Method not allowed");
            return;
        }

        try {
            WeatherCondition weather = weatherService.getCurrentWeather();
            String sessionId = sessionManager.createSession();
            Game game = sessionManager.getSession(sessionId);
            LOGGER.info(() -> "Starting session " + sessionId + " with weather " + weather);
            game.startGame(exchange, sessionId, weather);
        } catch (Exception exception) {
            LOGGER.log(Level.SEVERE, "Failed to start game request " + request, exception);
            sendError(exchange, 500, exception.getMessage());
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        LOGGER.info(() -> "Responding " + statusCode + " to " + exchange.getRequestURI());
        addCorsHeaders(exchange);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] responseBytes = response.getBytes();
        exchange.sendResponseHeaders(statusCode, responseBytes.length);
        exchange.getResponseBody().write(responseBytes);
        exchange.close();
    }

    private void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        sendResponse(exchange, statusCode, String.format("{\"error\":\"%s\"}", escapeJson(message)));
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private String escapeJson(String str) {
        return str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
