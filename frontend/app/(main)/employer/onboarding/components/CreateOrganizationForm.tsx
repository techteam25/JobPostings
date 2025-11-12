"use client";
import { useState } from "react";

import { X } from "lucide-react";
const CreateOrganizationForm = () => {
  const [formData, setFormData] = useState({
    companyName: "XYZ Games",
    ceo: "Raf Martins",
    industry: "Gaming",
    foundedYear: "2018",
    companySize: "11-50",
    officialSite: "https://www.example.com",
    countries: ["USA", "Germany", "Ukraine"],
    categories: ["online gaming", "game art"],
  });

  const removeCountry = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      countries: prev.countries.filter((c) => c !== country),
    }));
  };

  const removeCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
  };

  const getCountryFlag = (country: string) => {
    const flags = {
      USA: "🇺🇸",
      Germany: "🇩🇪",
      Ukraine: "🇺🇦",
    };
    return flags[country as keyof typeof flags] || "🌍";
  };

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Company's name
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, companyName: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Chief Executive Officer
          </label>
          <input
            type="text"
            value={formData.ceo}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, ceo: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Primary industry
          </label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, industry: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Founded in
          </label>
          <input
            type="text"
            value={formData.foundedYear}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, foundedYear: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Company size
          </label>
          <select
            value={formData.companySize}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, companySize: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201-500">201-500</option>
            <option value="500+">500+</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Official site
          </label>
          <input
            type="text"
            value={formData.officialSite}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, officialSite: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Countries
        </label>
        <div className="flex flex-wrap gap-2">
          {formData.countries.map((country) => (
            <div
              key={country}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
            >
              <span>{getCountryFlag(country)}</span>
              <span className="text-sm">{country}</span>
              <button
                onClick={() => removeCountry(country)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Categories
        </label>
        <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 p-3">
          {formData.categories.map((category) => (
            <div
              key={category}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
            >
              <span className="text-sm">{category}</span>
              <button
                onClick={() => removeCategory(category)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateOrganizationForm;
