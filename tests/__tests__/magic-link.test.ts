/**
 * @file magic-link.test.ts
 * @description 매직 링크 인증 기능 테스트
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMagicLink } from "@/actions/auth";

// Supabase 클라이언트 모킹
vi.mock("@/utils/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(() => ({
      auth: {
        signInWithOtp: vi.fn(async ({ email }) => {
          if (email === "invalid@email") {
            return {
              error: { message: "invalid email" },
            };
          }
          if (email === "ratelimit@example.com") {
            return {
              error: { message: "rate limit exceeded" },
            };
          }
          return { error: null };
        }),
      },
    })),
  };
});

describe("매직 링크 인증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("유효한 이메일로 매직 링크 전송에 성공해야 합니다", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");

    const result = await sendMagicLink(null, formData);

    expect(result.error).toBeNull();
    expect(result.success).toBe(
      "매직 링크를 이메일로 전송했습니다. 이메일을 확인해주세요.",
    );
  });

  it("잘못된 이메일 형식일 때 에러를 반환해야 합니다", async () => {
    const formData = new FormData();
    formData.set("email", "invalid-email");

    const result = await sendMagicLink(null, formData);

    expect(result.error).toBe("입력 필드를 확인해주세요.");
    expect(result.success).toBeNull();
    expect(result.fieldErrors?.email).toBe(
      "유효한 이메일 주소를 입력해주세요.",
    );
  });

  it("레이트 리미트 에러를 처리해야 합니다", async () => {
    const formData = new FormData();
    formData.set("email", "ratelimit@example.com");

    const result = await sendMagicLink(null, formData);

    expect(result.error).toBe(
      "너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.",
    );
    expect(result.success).toBeNull();
  });

  it("Supabase에서 유효하지 않은 이메일 에러를 처리해야 합니다", async () => {
    const formData = new FormData();
    formData.set("email", "invalid@email");

    const result = await sendMagicLink(null, formData);

    expect(result.error).toBe("입력 필드를 확인해주세요.");
    expect(result.success).toBeNull();
    expect(result.fieldErrors?.email).toBe(
      "유효한 이메일 주소를 입력해주세요.",
    );
  });
});
