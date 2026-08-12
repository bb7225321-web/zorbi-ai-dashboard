import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Chat history for the signed-in user, oldest first.
 */
export const messages = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .take(200);
  },
});

/**
 * Append a user message to the conversation.
 */
export const sendMessage = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const content = args.content.trim().slice(0, 2000);
    if (content.length === 0) {
      throw new Error("Message cannot be empty");
    }
    await ctx.db.insert("chatMessages", {
      userId,
      role: "user",
      content,
      createdAt: Date.now(),
    });
  },
});

/**
 * Have Zorbi reply to the latest user message. The client calls this after a
 * short typing delay so the conversation feels natural. v1 ships with a
 * built-in tutor brain; a real AI provider can be wired in later.
 */
export const generateReply = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return;
    }
    const latest = await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (latest === null || latest.role !== "user") {
      return;
    }
    await ctx.db.insert("chatMessages", {
      userId,
      role: "assistant",
      content: composeTutorReply(latest.content),
      createdAt: Date.now(),
    });
  },
});

/**
 * Small offline tutor brain for v1. Keyword-aware, encouraging, and specific
 * enough to feel genuinely helpful while a real AI provider is wired up.
 */
function composeTutorReply(prompt: string): string {
  const p = prompt.toLowerCase();

  if (/(derivative|differentiat|calculus|integral|limit)/.test(p)) {
    return (
      "Great question! Here's a way to think about it:\n\n" +
      "• Derivatives measure *how fast* something changes — the slope of a function at a point.\n" +
      "• The power rule is your best friend: if f(x) = xⁿ, then f'(x) = n·xⁿ⁻¹.\n" +
      "• Work one small example slowly (like x² + 3x), then check your result on a graph.\n\n" +
      "Want me to walk through a step-by-step example or quiz you on a few?"
    );
  }

  if (/(physics|force|energy|motion|velocity|chapter)/.test(p)) {
    return (
      "Love it — physics is all about spotting patterns in motion and energy. Quick framework:\n\n" +
      "• Write down what you *know* and what you're solving for first.\n" +
      "• Pick one equation that links them (for motion: v = u + at is usually the starting point).\n" +
      "• Check units before you calculate — that catches most mistakes!\n\n" +
      "Would you like a worked example from Chapter 6, or a 3-question mini-quiz?"
    );
  }

  if (/(chem|molecule|formula|reaction|periodic)/.test(p)) {
    return (
      "Chemistry clicks when you connect the three levels: what you see, what's happening at the particle level, and the equation. Try this:\n\n" +
      "• For reactions: balance atoms, then charges, then check states.\n" +
      "• For formulas: memorize the common polyatomic ions — they show up constantly.\n" +
      "• Use the periodic table as a map: groups tell you charge and bonding behavior.\n\n" +
      "Want me to drill your formula sheet with you?"
    );
  }

  if (/(essay|english|writing|grammar|essay|thesis)/.test(p)) {
    return (
      "Let's make your writing sharper! Here's the checklist I use:\n\n" +
      "• One clear thesis in the first paragraph — every paragraph should defend it.\n" +
      "• Open each paragraph with a topic sentence, then evidence, then your own analysis.\n" +
      "• Read it aloud once: if a sentence makes you stumble, it needs rewriting.\n\n" +
      "Paste a paragraph and I'll help you tighten it, or we can outline the whole essay together."
    );
  }

  if (/(quiz|test|practice|exam|question|revise|revision)/.test(p)) {
    return (
      "Awesome — let's make revision active. Here's a 60-second plan:\n\n" +
      "• Pick ONE topic you're least confident in.\n" +
      "• Close your notes and explain it out loud in 3 sentences.\n" +
      "• Then answer 3 quick questions on it — I'll mark them.\n\n" +
      "Say \"start\" and I'll give you the first question!"
    );
  }

  if (/(hello|hi |hey|yo|good (morning|afternoon|evening))/.test(p)) {
    return (
      "Hey there! 👋 I'm Zorbi, your AI study buddy.\n\n" +
      "I can explain concepts, walk through problems step by step, quiz you, or help you plan revision. " +
      "What are we tackling today — math, physics, chemistry, or English?"
    );
  }

  if (/(thank|thanks|great|awesome|helpful)/.test(p)) {
    return (
      "You're welcome! 😊 The best way to lock it in is to explain it back to me in your own words — " +
      "or try one practice question. Want to?"
    );
  }

  return (
    "Happy to help with that! A good first step is to break it into smaller pieces:\n\n" +
    "• What's the topic or subject?\n" +
    "• What have you tried so far?\n" +
    "• What's the goal — understanding, homework, or revision?\n\n" +
    "Tell me a bit more and I'll give you a focused, step-by-step plan. 📚"
  );
}
