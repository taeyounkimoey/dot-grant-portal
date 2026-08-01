// components/shared/SmartFormWizard.jsx
"use client";
import { useState } from 'react';
import { Button, FormGroup, Label, Radio } from '@trussworks/react-uswds';

export default function SmartFormWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ orgType: '', grantType: '' });

  const handleOrgChange = (e) => {
    setFormData({ ...formData, orgType: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div className="usa-form-container border-2 p-6 rounded-lg bg-white shadow-sm">
      <div className="mb-4 text-sm text-gray-500">Step {step} of 3</div>
      
      {step === 1 && (
        <FormGroup>
          <Label className="text-xl font-bold">What type of organization do you represent?</Label>
          <div className="mt-4 space-y-2">
            <Radio id="org-state" name="orgType" label="State Department of Transportation" value="state" onChange={handleOrgChange} checked={formData.orgType === 'state'} />
            <Radio id="org-tribal" name="orgType" label="Tribal Government" value="tribal" onChange={handleOrgChange} checked={formData.orgType === 'tribal'} />
            <Radio id="org-muni" name="orgType" label="Local Municipality / City" value="muni" onChange={handleOrgChange} checked={formData.orgType === 'muni'} />
          </div>
          <Button type="button" className="mt-6 bg-blue-900" onClick={nextStep} disabled={!formData.orgType}>Continue</Button>
        </FormGroup>
      )}

      {step === 2 && (
        <FormGroup>
          <Label className="text-xl font-bold">Based on your organization type, choose your project class:</Label>
          <div className="mt-4 space-y-2">
            {formData.orgType === 'tribal' ? (
              <p className="text-green-700 font-semibold">✓ You are eligible for streamlined Tribal Transportation Program (TTP) funding. Click continue.</p>
            ) : (
              <>
                <Radio id="type-cap" name="grantType" label="Capital Asset Construction" value="capital" onChange={(e) => setFormData({...formData, grantType: e.target.value})} />
                <Radio id="type-plan" name="grantType" label="Local Planning & Feasibility Study" value="planning" onChange={(e) => setFormData({...formData, grantType: e.target.value})} />
              </>
            )}
          </div>
          <div className="mt-6 flex space-x-2">
            <Button type="button" outline onClick={prevStep}>Back</Button>
            <Button type="button" className="bg-blue-900" onClick={() => onComplete(formData)}>Calculate Checklist</Button>
          </div>
        </FormGroup>
      )}
    </div>
  );
}