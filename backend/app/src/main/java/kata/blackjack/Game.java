package kata.blackjack;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.logging.Logger;

public class Game {
    private static final Logger LOGGER = Logger.getLogger(Game.class.getName());

    private final List<String> deck = new ArrayList<>();
    private final List<String> playerHand = new ArrayList<>();
    private final List<String> dealerHand = new ArrayList<>();
    private GameState state;
    private WeatherCondition weather = WeatherCondition.UNKNOWN;

    private enum GameState {
        INITIAL,
        PLAYER_PLAYING,
        PLAYER_STAND,
        DEALER_PLAYING,
        GAME_OVER
    }

    private enum GameResult {
        PLAYER_WIN,
        DEALER_WIN,
        PUSH,
        PLAYER_BUST,
        DEALER_BUST
    }

    public Game() {
        resetGame();
    }

    private void resetGame() {
        deck.clear();
        playerHand.clear();
        dealerHand.clear();

        var cardValues = List.of("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K");
        var suits = List.of("spades", "diamonds", "hearts", "clubs");
        for (String suit : suits) {
            for (String cardValue : cardValues) {
                deck.add(suit + "|" + cardValue);
            }
        }
        Collections.shuffle(deck);
        state = GameState.INITIAL;
        weather = WeatherCondition.UNKNOWN;
    }

    public void startGame(HttpExchange exchange, String sessionId) throws IOException {
        startGame(exchange, sessionId, WeatherCondition.UNKNOWN);
    }

    public void startGame(HttpExchange exchange, String sessionId, WeatherCondition weather) throws IOException {
        this.weather = weather == null ? WeatherCondition.UNKNOWN : weather;
        playerHand.add(drawCard());
        dealerHand.add(drawCard());
        playerHand.add(drawCard());
        dealerHand.add(drawCard());

        if (isBlackjack(playerHand) || isBlackjack(dealerHand)) {
            state = GameState.GAME_OVER;
        } else {
            state = GameState.PLAYER_PLAYING;
        }

        LOGGER.info(() -> String.format(
                "Started session %s: weather=%s, state=%s, playerScore=%d, dealerScore=%d",
                sessionId,
                this.weather,
                state,
                calculateScore(playerHand),
                calculateScore(dealerHand)
        ));

        String response = String.format(
                "{\"sessionId\":\"%s\",\"game\":%s}",
                sessionId,
                toJson()
        );
        sendResponse(exchange, 200, response);
    }

    public void performAction(HttpExchange exchange, String action) throws IOException {
        LOGGER.info(() -> "Performing action '" + action + "' from state " + state);

        if ("hit".equals(action)) {
            playerHit();
        } else if ("stand".equals(action)) {
            playerStand();
        }

        LOGGER.info(() -> String.format(
                "Completed action '%s': state=%s, playerScore=%d, dealerScore=%d%s",
                action,
                state,
                calculateScore(playerHand),
                calculateScore(dealerHand),
                state == GameState.GAME_OVER ? ", result=" + getResult() : ""
        ));
        sendResponse(exchange, 200, toJson());
    }

    private void playerHit() {
        if (state != GameState.PLAYER_PLAYING) {
            throw new IllegalStateException("Not in player playing state");
        }
        playerHand.add(drawCard());
        if (isBusted(playerHand)) {
            state = GameState.GAME_OVER;
        }
    }

    private void playerStand() {
        if (state != GameState.PLAYER_PLAYING) {
            throw new IllegalStateException("Not in player playing state");
        }
        state = GameState.DEALER_PLAYING;
        dealerPlay();
    }

    private void dealerPlay() {
        while (calculateScore(dealerHand) < 17) {
            dealerHand.add(drawCard());
        }
        state = GameState.GAME_OVER;
    }

    private String drawCard() {
        if (deck.isEmpty()) {
            throw new IllegalStateException("No cards left in deck");
        }
        return deck.removeLast();
    }

    private int calculateScore(List<String> hand) {
        int score = 0;
        int aces = 0;

        for (String card : hand) {
            int cardValue = getCardValue(getRank(card));
            if (cardValue == 11) {
                aces++;
            }
            score += cardValue;
        }

        while (score > 21 && aces > 0) {
            score -= 11;
            aces--;
        }

        return score;
    }

    private boolean isBusted(List<String> hand) {
        return calculateScore(hand) > 21;
    }

    private boolean isBlackjack(List<String> hand) {
        return hand.size() == 2 && calculateScore(hand) == 21;
    }

    private int getCardValue(String rank) {
        return switch (rank) {
            case "A" -> 11;
            case "K", "Q", "J" -> 10;
            default -> Integer.parseInt(rank);
        };
    }

    private String getSuit(String card) {
        return card.substring(0, card.indexOf('|'));
    }

    private String getRank(String card) {
        return card.substring(card.indexOf('|') + 1);
    }

    private GameResult getResult() {
        int playerScore = calculateScore(playerHand);
        int dealerScore = calculateScore(dealerHand);

        if (isBusted(playerHand)) {
            return GameResult.PLAYER_BUST;
        }
        if (isBusted(dealerHand)) {
            return GameResult.DEALER_BUST;
        }
        if (playerScore > dealerScore) {
            return GameResult.PLAYER_WIN;
        }
        if (dealerScore > playerScore) {
            return GameResult.DEALER_WIN;
        }
        return GameResult.PUSH;
    }

    private String toJson() {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"weather\":\"").append(weather).append("\",");
        json.append("\"state\":\"").append(state).append("\",");
        json.append("\"playerHand\":").append(serializeHand(playerHand)).append(",");
        json.append("\"dealerHand\":").append(serializeHand(dealerHand)).append(",");
        json.append("\"playerScore\":").append(calculateScore(playerHand)).append(",");
        json.append("\"dealerScore\":").append(calculateScore(dealerHand));

        if (state == GameState.GAME_OVER) {
            json.append(",\"result\":\"").append(getResult()).append("\"");
        }

        json.append("}");
        return json.toString();
    }

    private String serializeHand(List<String> hand) {
        String cards = hand.stream()
                .map(card -> String.format("{\"suit\":\"%s\",\"rank\":\"%s\"}", getSuit(card), getRank(card)))
                .collect(Collectors.joining(","));
        return "[" + cards + "]";
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        LOGGER.info(() -> "Responding " + statusCode + " to " + exchange.getRequestURI());
        addCorsHeaders(exchange);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] responseBytes = response.getBytes();
        exchange.sendResponseHeaders(statusCode, responseBytes.length);
        exchange.getResponseBody().write(responseBytes);
        exchange.close();
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }
}
