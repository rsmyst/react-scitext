import type { Meta, StoryObj } from "@storybook/react";
import { Smiles } from "../src/components/Smiles";

const meta = {
  component: Smiles,
  title: "React SciText/Smiles",
  parameters: {
    docs: {
      description: {
        component: 'Chemical structure renderer using SMILES notation'
      }
    }
  },
  args: {
    errorCallback: (error: unknown) => console.error('SMILES Error:', error),
  },
  argTypes: {
    code: {
      control: 'text',
      description: 'SMILES code for the chemical structure'
    },
    errorCallback: {
      control: false,
      description: 'Callback function for handling errors'
    }
  }
} satisfies Meta<typeof Smiles>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Methane: Story = {
  args: {
    code: "C",
  },
  parameters: {
    docs: {
      description: {
        story: 'Methane (CH₄) - simplest alkane'
      }
    }
  }
};

export const Ethane: Story = {
  args: {
    code: "CC",
  },
  parameters: {
    docs: {
      description: {
        story: 'Ethane (C₂H₆) - two carbon atoms'
      }
    }
  }
};

export const Benzene: Story = {
  args: {
    code: "c1ccccc1",
  },
  parameters: {
    docs: {
      description: {
        story: 'Benzene (C₆H₆) - aromatic ring'
      }
    }
  }
};

// Functional Groups
export const Ethanol: Story = {
  args: {
    code: "CCO",
  },
  parameters: {
    docs: {
      description: {
        story: 'Ethanol (C₂H₅OH) - alcohol functional group'
      }
    }
  }
};

export const AceticAcid: Story = {
  args: {
    code: "CC(=O)O",
  },
  parameters: {
    docs: {
      description: {
        story: 'Acetic acid (CH₃COOH) - carboxylic acid'
      }
    }
  }
};

export const Acetone: Story = {
  args: {
    code: "CC(=O)C",
  },
  parameters: {
    docs: {
      description: {
        story: 'Acetone (CH₃COCH₃) - ketone functional group'
      }
    }
  }
};

// Aromatic Compounds
export const Toluene: Story = {
  args: {
    code: "Cc1ccccc1",
  },
  parameters: {
    docs: {
      description: {
        story: 'Toluene (C₇H₈) - methylbenzene'
      }
    }
  }
};

export const Phenol: Story = {
  args: {
    code: "Oc1ccccc1",
  },
  parameters: {
    docs: {
      description: {
        story: 'Phenol (C₆H₅OH) - aromatic alcohol'
      }
    }
  }
};

export const Aniline: Story = {
  args: {
    code: "Nc1ccccc1",
  },
  parameters: {
    docs: {
      description: {
        story: 'Aniline (C₆H₅NH₂) - aromatic amine'
      }
    }
  }
};

// Polycyclic Compounds
export const Naphthalene: Story = {
  args: {
    code: "c1ccc2ccccc2c1",
  },
  parameters: {
    docs: {
      description: {
        story: 'Naphthalene (C₁₀H₈) - fused benzene rings'
      }
    }
  }
};

export const Anthracene: Story = {
  args: {
    code: "c1ccc2cc3ccccc3cc2c1",
  },
  parameters: {
    docs: {
      description: {
        story: 'Anthracene (C₁₄H₁₀) - three fused benzene rings'
      }
    }
  }
};

// Cyclic Compounds
export const Cyclohexane: Story = {
  args: {
    code: "C1CCCCC1",
  },
  parameters: {
    docs: {
      description: {
        story: 'Cyclohexane (C₆H₁₂) - six-membered ring'
      }
    }
  }
};

export const Cyclopentane: Story = {
  args: {
    code: "C1CCCC1",
  },
  parameters: {
    docs: {
      description: {
        story: 'Cyclopentane (C₅H₁₀) - five-membered ring'
      }
    }
  }
};

// Stereochemistry
export const LacticAcid: Story = {
  args: {
    code: "C[C@H](O)C(=O)O",
  },
  parameters: {
    docs: {
      description: {
        story: 'L-Lactic acid - showing stereochemistry with @'
      }
    }
  }
};

export const Glucose: Story = {
  args: {
    code: "C([C@@H]1[C@H]([C@@H]([C@H]([C@H](O1)O)O)O)O)O",
  },
  parameters: {
    docs: {
      description: {
        story: 'D-Glucose - complex stereochemistry'
      }
    }
  }
};

// Biomolecules
export const Caffeine: Story = {
  args: {
    code: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
  },
  parameters: {
    docs: {
      description: {
        story: 'Caffeine (C₈H₁₀N₄O₂) - purine alkaloid'
      }
    }
  }
};

export const Aspirin: Story = {
  args: {
    code: "CC(=O)OC1=CC=CC=C1C(=O)O",
  },
  parameters: {
    docs: {
      description: {
        story: 'Aspirin (C₉H₈O₄) - acetylsalicylic acid'
      }
    }
  }
};

// Multiple Bonds
export const Ethene: Story = {
  args: {
    code: "C=C",
  },
  parameters: {
    docs: {
      description: {
        story: 'Ethene (C₂H₄) - double bond'
      }
    }
  }
};

export const Ethyne: Story = {
  args: {
    code: "C#C",
  },
  parameters: {
    docs: {
      description: {
        story: 'Ethyne (C₂H₂) - triple bond'
      }
    }
  }
};

// Charged Species
export const SodiumIon: Story = {
  args: {
    code: "[Na+]",
  },
  parameters: {
    docs: {
      description: {
        story: 'Sodium ion (Na⁺) - positive charge'
      }
    }
  }
};

export const ChlorideIon: Story = {
  args: {
    code: "[Cl-]",
  },
  parameters: {
    docs: {
      description: {
        story: 'Chloride ion (Cl⁻) - negative charge'
      }
    }
  }
};

// Error Cases
export const InvalidSmiles: Story = {
  args: {
    code: "invalid&smiles",
  },
  parameters: {
    docs: {
      description: {
        story: 'Invalid SMILES code - should show error message'
      }
    }
  }
};

export const EmptySmiles: Story = {
  args: {
    code: "",
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty SMILES code - should handle gracefully'
      }
    }
  }
};

// Complex Molecules
export const Penicillin: Story = {
  args: {
    code: "CC1([C@@H](N2[C@H](S1)[C@@H](C2=O)NC(=O)CC3=CC=CC=C3)C(=O)O)C",
  },
  parameters: {
    docs: {
      description: {
        story: 'Penicillin G - complex antibiotic structure'
      }
    }
  }
};

export const Cholesterol: Story = {
  args: {
    code: "C[C@H](CCCC(C)C)[C@H]1CC[C@@H]2[C@@]1(CC[C@H]3[C@H]2CC=C4[C@@]3(CC[C@@H](C4)O)C)C",
  },
  parameters: {
    docs: {
      description: {
        story: 'Cholesterol - steroid molecule'
      }
    }
  }
};

// Performance Test
export const LargeMolecule: Story = {
  args: {
    code: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
  },
  parameters: {
    docs: {
      description: {
        story: 'Very long chain hydrocarbon - performance test'
      }
    }
  }
};