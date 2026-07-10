const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const round = (value) => Number(value.toFixed(2));

const standardDeviation = (values) => {
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const buildTrend = (scores) => {
  const midpoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, midpoint);
  const secondHalf = scores.slice(midpoint);

  const firstAverage = average(firstHalf);
  const secondAverage = average(secondHalf);
  const delta = secondAverage - firstAverage;

  let direction = "stable";
  if (delta < -1.5) {
    direction = "improving";
  } else if (delta > 1.5) {
    direction = "declining";
  }

  return {
    direction,
    firstHalfAverage: round(firstAverage),
    secondHalfAverage: round(secondAverage),
    delta: round(delta),
    summary:
      direction === "improving"
        ? "Recent scores are trending upward compared with the earlier part of the sample."
        : direction === "declining"
          ? "Recent scores have softened and need attention before the next cycle."
          : "Scores are holding fairly steady without a large directional shift."
  };
};

const buildConsistency = (scores) => {
  const deviation = standardDeviation(scores);
  let band = "low";
  let summary = "Your scoring pattern is highly repeatable, which is a good base to build on.";

  if (deviation > 8) {
    band = "volatile";
    summary = "Your results swing quite a bit from round to round, so stability is the biggest opportunity.";
  } else if (deviation > 4) {
    band = "moderate";
    summary = "You have decent rhythm, but a few uneven rounds are still widening the spread.";
  }

  return {
    deviation: round(deviation),
    band,
    summary
  };
};

const buildImprovementSuggestions = ({ trend, consistency, scores }) => {
  const suggestions = [];
  const latest = scores[scores.length - 1];
  const previous = scores[scores.length - 2];

  if (consistency.band === "volatile") {
    suggestions.push({
      title: "Reduce score swings",
      suggestion:
        "Focus on one repeatable pre-shot or pre-activity routine so your lower-end rounds stop dragging the average."
    });
  }

  if (trend.direction === "declining") {
    suggestions.push({
      title: "Reset the baseline",
      suggestion:
        "Schedule a lighter session aimed at control and confidence before chasing another peak performance."
    });
  }

  if (trend.direction === "stable" && consistency.band === "low") {
    suggestions.push({
      title: "Push the ceiling",
      suggestion:
        "Your base level looks reliable, so the next gain likely comes from adding one deliberate high-focus session each week."
    });
  }

  if (latest < previous) {
    suggestions.push({
      title: "Build on the latest round",
      suggestion:
        "Your most recent score moved in the right direction, so repeat the same routine while it is still fresh."
    });
  } else {
    suggestions.push({
      title: "Reset the baseline",
      suggestion:
        "The latest score rose, so review what changed in preparation or pacing before the next logged result."
    });
  }

  if (suggestions.length < 3) {
    suggestions.push({
      title: "Stay consistent with logging",
      suggestion:
        "Frequent score logging gives the system better signal and makes trend analysis far more useful month to month."
    });
  }

  return suggestions.slice(0, 3);
};

const analyzeScores = ({ scores }) => {
  const normalizedScores = [...scores]
    .map((entry) => ({
      score: entry.score,
      date: entry.date || null,
      label: entry.label || null
    }))
    .sort((left, right) => {
      if (!left.date || !right.date) {
        return 0;
      }

      return new Date(left.date) - new Date(right.date);
    });

  const values = normalizedScores.map((entry) => entry.score);
  const trend = buildTrend(values);
  const consistency = buildConsistency(values);
  const bestScore = Math.min(...values);
  const latestScore = values[values.length - 1];
  const averageScore = average(values);

  return {
    overview: {
      averageScore: round(averageScore),
      bestScore,
      latestScore,
      sampleSize: values.length
    },
    trend,
    consistency,
    suggestions: buildImprovementSuggestions({
      trend,
      consistency,
      scores: values
    })
  };
};

module.exports = {
  analyzeScores
};

