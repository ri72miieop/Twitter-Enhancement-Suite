import React, { useState } from 'react';

const UnifiedDiffViewer = () => {
  // Sample version history
  const [versions, setVersions] = useState([
    {
      id: 1,
      text: "Twitter is a social media platform where users can post short messages.",
      timestamp: new Date("2024-01-01"),
      author: "Alice"
    },
    {
      id: 2,
      text: "Twitter (now X) is a social media platform where users can post messages and images.",
      timestamp: new Date("2024-01-15"),
      author: "Bob"
    },
    {
      id: 3,
      text: "X (formerly Twitter) is a social network where users can post messages, images, and longer articles.",
      timestamp: new Date("2024-01-30"),
      author: "Charlie"
    },
    {
      id: 4,
      text: "X is a global social network enabling users to share messages, media, and long-form content.",
      timestamp: new Date("2024-02-15"),
      author: "David"
    }
  ]);

  const [sourceVersionId, setSourceVersionId] = useState(1);
  const [targetVersionId, setTargetVersionId] = useState(2);

  // Compute text diff
  const tokenize = (text) => {
    return text.split(/(\s+)/).filter(Boolean);
  };

  const computeDiff = (oldTokens, newTokens) => {
    const matrix = Array(oldTokens.length + 1)
      .fill(null)
      .map(() => Array(newTokens.length + 1).fill(0));

    for (let i = 1; i <= oldTokens.length; i++) {
      for (let j = 1; j <= newTokens.length; j++) {
        if (oldTokens[i - 1] === newTokens[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }

    const diff = [];
    let i = oldTokens.length;
    let j = newTokens.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
        diff.unshift({ type: 'same', text: oldTokens[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
        diff.unshift({ type: 'added', text: newTokens[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
        diff.unshift({ type: 'removed', text: oldTokens[i - 1] });
        i--;
      }
    }

    return diff;
  };

  const sourceVersion = versions.find(v => v.id === sourceVersionId);
  const targetVersion = versions.find(v => v.id === targetVersionId);
  
  const oldTokens = tokenize(sourceVersion.text);
  const newTokens = tokenize(targetVersion.text);
  const diff = computeDiff(oldTokens, newTokens);

  // Quick selection buttons for common comparisons
  const quickSelections = [
    {
      label: "Compare with next",
      action: () => {
        const currentIndex = versions.findIndex(v => v.id === sourceVersionId);
        if (currentIndex < versions.length - 1) {
          setSourceVersionId(versions[currentIndex].id);
          setTargetVersionId(versions[currentIndex + 1].id);
        }
      }
    },
    {
      label: "Compare with latest",
      action: () => {
        setSourceVersionId(sourceVersionId);
        setTargetVersionId(versions[versions.length - 1].id);
      }
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50">
      <div className="space-y-6">
        {/* Version Selection Controls */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Source Version:</label>
                <select
                  value={sourceVersionId}
                  onChange={(e) => setSourceVersionId(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                >
                  {versions.map(version => (
                    <option key={version.id} value={version.id}>
                      Version {version.id} - {version.author} ({version.timestamp.toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Target Version:</label>
                <select
                  value={targetVersionId}
                  onChange={(e) => setTargetVersionId(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                >
                  {versions.map(version => (
                    <option key={version.id} value={version.id}>
                      Version {version.id} - {version.author} ({version.timestamp.toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4">
              {quickSelections.map((selection, index) => (
                <button
                  key={index}
                  onClick={selection.action}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                >
                  {selection.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Source Version {sourceVersion.id}</h3>
              <p className="mt-1 text-xs text-gray-500">
                By {sourceVersion.author} on {sourceVersion.timestamp.toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Target Version {targetVersion.id}</h3>
              <p className="mt-1 text-xs text-gray-500">
                By {targetVersion.author} on {targetVersion.timestamp.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Diff Legend */}
        <div className="flex space-x-4 text-sm">
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-200 mr-1"></span>
            Removed
          </span>
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-200 mr-1"></span>
            Added
          </span>
        </div>

        {/* Diff View */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          {diff.map((part, index) => (
            <span
              key={index}
              className={`${
                part.type === 'removed'
                  ? 'bg-red-200 line-through'
                  : part.type === 'added'
                  ? 'bg-green-200'
                  : ''
              }`}
            >
              {part.text}
            </span>
          ))}
        </div>

        {/* Add New Version Form */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-4">Add New Version</h3>
          <div className="space-y-4">
            <textarea
              placeholder="Enter new version text..."
              className="w-full p-2 border rounded-lg h-24"
              onChange={(e) => {
                if (e.target.value.trim()) {
                  const newVersion = {
                    id: versions.length + 1,
                    text: e.target.value,
                    timestamp: new Date(),
                    author: "Current User"
                  };
                  setVersions([...versions, newVersion]);
                  setSourceVersionId(versions[versions.length - 1].id);
                  setTargetVersionId(newVersion.id);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDiffViewer;