package kata.blackjack;

import java.io.IOException;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayNameGeneration;
import org.junit.jupiter.api.DisplayNameGenerator;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpExchange;

@DisplayNameGeneration(DisplayNameGenerator.ReplaceUnderscores.class)
class GameTest {

    @Disabled("""
            I wanted to give the game a hand containing an ace and a ten-value
            card, but calculateScore is private and the public entry point also
            requires an HttpExchange just to write the response.
            """)
    @Test
    void ShouldCalculateBlackjackScore() throws IOException {
        // Arrange
        Game game = new Game();

        // Act
        HttpExchange exchange = null;
        // when(exchange.getResponseHeaders()).thenReturn(...);
        // oh my god, I'm in mocking hell
        // I don't even get anything returned
        game.startGame(exchange, "test-session");

        // Assert
        // assertThat(...).isEqualTo(21);
    }
}
