import { describe, expect, it } from "vitest";
import { AvatarUrl } from "../../domain/AvatarUrl.ts";
import { Email } from "../../domain/Email.ts";
import { InvalidAvatarUrlError } from "../../domain/errors/InvalidAvatarUrlError.ts";
import { InvalidEmailError } from "../../domain/errors/InvalidEmailError.ts";
import { InvalidUserIdError } from "../../domain/errors/InvalidUserIdError.ts";
import { InvalidUserNameError } from "../../domain/errors/InvalidUserNameError.ts";
import { User } from "../../domain/User.ts";
import { UserId } from "../../domain/UserId.ts";
import { UserName } from "../../domain/UserName.ts";
import * as UserMother from "../helpers/UserMother.ts";

describe("User", () => {
  describe("Basic behaviour", () => {
    it("survives a primitive round-trip", () => {
      const primitive = UserMother.createPrimitive();

      expect(User.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
      expect(User.fromPrimitive({ ...primitive, avatarUrl: null }).getAvatarUrl()).toBeNull();
    });

    it("shows the initial of the name", () => {
      expect(UserName.create("  ada lovelace").initial()).toBe("A");
      expect(UserName.create("Ñandú").initial()).toBe("Ñ");
    });

    it("normalizes the email", () => {
      expect(Email.create(" Ada@Example.COM ").toPrimitive()).toBe("ada@example.com");
    });

    it("compares by id", () => {
      const user = UserMother.create();

      expect(user.equals(UserMother.create({ id: user.toPrimitive().id }))).toBe(true);
      expect(user.equals(UserMother.create())).toBe(false);
      expect(UserId.create("a").equals(UserId.create("b"))).toBe(false);
      expect(Email.create("a@b.c").equals(Email.create("A@B.C"))).toBe(true);
      expect(AvatarUrl.create("https://a.test/x.png").equals(AvatarUrl.create("https://a.test/y.png"))).toBe(false);
      expect(UserName.create("Ada").equals(UserName.create("Ada"))).toBe(true);
    });
  });

  describe("Error scenarios", () => {
    it.each([
      ["id", () => UserId.create(" "), InvalidUserIdError],
      ["name", () => UserName.create(""), InvalidUserNameError],
      ["email", () => Email.create("ada"), InvalidEmailError],
      ["avatar", () => AvatarUrl.create("/me.png"), InvalidAvatarUrlError],
    ])("rejects an invalid %s", (_, build, error) => {
      expect(build).toThrow(error);
    });
  });
});
