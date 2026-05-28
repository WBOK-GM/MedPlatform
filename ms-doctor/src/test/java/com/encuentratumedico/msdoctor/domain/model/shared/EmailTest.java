package com.encuentratumedico.msdoctor.domain.model.shared;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmailTest {

    @Test
    void acceptsValidEmailAndNormalizesToLowercase() {
        Email email = Email.of("User@Example.COM");
        assertThat(email.value()).isEqualTo("user@example.com");
    }

    @Test
    void rejectsEmptyEmail() {
        assertThatThrownBy(() -> Email.of(""))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Email.of(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsInvalidFormat() {
        assertThatThrownBy(() -> Email.of("not-an-email"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Email.of("foo@"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void ofNullableReturnsNullForBlankInput() {
        assertThat(Email.ofNullable("")).isNull();
        assertThat(Email.ofNullable(null)).isNull();
        assertThat(Email.ofNullable("foo@bar.com")).isNotNull();
    }
}
