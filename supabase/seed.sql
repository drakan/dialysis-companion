-- Politique pour les patients
CREATE POLICY "Patients visibility" ON patients
    FOR ALL USING (
        auth.uid() = owner_id OR
        patient_id IN (SELECT patient_id FROM user_permissions WHERE user_id = auth.uid())
    );

-- Politique pour les détails patients
CREATE POLICY "Patient details access" ON patient_details
    FOR ALL USING (
        patient_id IN (SELECT patient_id FROM user_permissions WHERE user_id = auth.uid())
    );
