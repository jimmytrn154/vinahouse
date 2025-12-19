USE VinHousing;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_contract_activate $$
CREATE TRIGGER trg_contract_activate
BEFORE UPDATE ON contracts
FOR EACH ROW
BEGIN
    -- Only react when status changes into 'active'
    IF NEW.status = 'signed' AND OLD.status <> 'signed' THEN
        
        -- 1) Ensure signed_at is set when contract becomes active
        IF NEW.signed_at IS NULL THEN
            SET NEW.signed_at = NOW();
        END IF;

        -- 2) Mark related listing as rented
        UPDATE listings
        SET status = 'rented',
            updated_at = NOW()
        WHERE id = NEW.listing_id;
    END IF;
END $$

DELIMITER ;
