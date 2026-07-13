package kata.blackjack;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.logging.Logger;

public class App {
    private static final Logger LOGGER = Logger.getLogger(App.class.getName());

    static void main() throws IOException {
        LOGGER.info("Starting blackjack server on http://localhost:8080");

        GameSessionManager sessionManager = new GameSessionManager();
        WeatherService weatherService = new WeatherService(new OpenMeteoWeatherClient());

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/game/start", new GameStartHandler(sessionManager, weatherService));
        server.createContext("/game/hit", new GameActionHandler(sessionManager, "hit"));
        server.createContext("/game/stand", new GameActionHandler(sessionManager, "stand"));

        server.setExecutor(null);
        server.start();
        LOGGER.info("Blackjack server started on http://localhost:8080");
    }
}
