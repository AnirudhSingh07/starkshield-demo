import { verifyProof } from "starkshield";

export async function POST(request) {
  try {
    const body = await request.json();
    const { age } = body;
    console.log(age);

    if (age === undefined || age === null) {
      return Response.json({ error: "Missing age" }, { status: 400 });
    }

    if (isNaN(Number(age))) {
      return Response.json({ error: "age must be a number" }, { status: 400 });
    }

    // Circuit has only one private input: age
    // The 18 threshold is hardcoded inside the circom circuit itself
    const result = await verifyProof(
      { input: { age: String(age) } },
      "./zk/agecheck" // relative path to your compiled circuit folder at project root
    );

    const { verified, publicSignals } = await verifyProof(
  { input: { age: String(age) } },
  "./zk/agecheck"
);

console.log("Public signals", publicSignals);
// publicSignals[0] is isAdult: "1" = age >= 18, "0" = age < 18
const isAdult = publicSignals[0] === '1';

return Response.json({
  verified,
  isAdult,
  publicSignals,
  message: verified
    ? (isAdult ? "✅ Proven: age ≥ 18" : "❌ Proven: age < 18")
    : "Verification failed",
});

  } catch (err) {
    console.error("[verify-age] Error:", err);
    return Response.json(
      { error: "Proof generation or verification failed", details: err.message },
      { status: 500 }
    );
  }
}